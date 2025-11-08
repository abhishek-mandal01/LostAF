from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import base64
import io
from PIL import Image
import torch
from sentence_transformers import SentenceTransformer
import numpy as np
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Load CLIP model for image similarity
print("Loading CLIP model...")
model = SentenceTransformer('clip-ViT-B-32')
print("CLIP model loaded successfully")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Email service
def send_email(to: str, subject: str, html_content: str):
    try:
        message = Mail(
            from_email=os.environ['SENDER_EMAIL'],
            to_emails=to,
            subject=subject,
            html_content=html_content
        )
        sg = SendGridAPIClient(os.environ['SENDGRID_API_KEY'])
        response = sg.send(message)
        return response.status_code == 202
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")
        return False

# ============ Models ============
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    picture: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Item(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # 'lost' or 'found'
    title: str
    category: str
    location: str
    date: str
    description: str
    image_url: Optional[str] = None
    image_embedding: Optional[List[float]] = None
    user_id: str
    user_name: str
    user_email: str
    is_anonymous: bool = False
    status: str = "active"  # active, resolved
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item1_id: str
    item2_id: str
    similarity_score: float
    notified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ItemCreate(BaseModel):
    type: str
    title: str
    category: str
    location: str
    date: str
    description: str
    is_anonymous: bool = False

class ItemResponse(BaseModel):
    id: str
    type: str
    title: str
    category: str
    location: str
    date: str
    description: str
    image_url: Optional[str]
    user_name: str
    user_email: str
    is_anonymous: bool
    status: str
    created_at: datetime
    matches: Optional[List[dict]] = []

# ============ Auth Helpers ============
async def get_current_user(request: Request) -> Optional[User]:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    # Find session
    session_doc = await db.user_sessions.find_one({"session_token": session_token})
    if not session_doc:
        return None
    
    # Handle both string and datetime formats for expires_at
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Find user
    user_doc = await db.users.find_one({"id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ============ Image Processing ============
def process_image(image_data: bytes) -> tuple:
    try:
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Resize if too large
        max_size = (800, 800)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Convert to RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Save as base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        img_url = f"data:image/jpeg;base64,{img_base64}"
        
        # Generate embedding
        embedding = model.encode(image).tolist()
        
        return img_url, embedding
    except Exception as e:
        logging.error(f"Image processing error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid image file")

# ============ Matching System ============
async def find_matches(item: Item, background_tasks: BackgroundTasks):
    if not item.image_embedding:
        return
    
    # Find opposite type items
    opposite_type = "found" if item.type == "lost" else "lost"
    
    # Get all active items of opposite type with embeddings
    cursor = db.items.find({
        "type": opposite_type,
        "status": "active",
        "image_embedding": {"$exists": True, "$ne": None}
    }, {"_id": 0})
    
    opposite_items = await cursor.to_list(100)
    
    item_embedding = np.array(item.image_embedding)
    
    for other_item in opposite_items:
        try:
            other_embedding = np.array(other_item["image_embedding"])
            
            # Calculate cosine similarity
            similarity = np.dot(item_embedding, other_embedding) / (
                np.linalg.norm(item_embedding) * np.linalg.norm(other_embedding)
            )
            
            # If similarity > 0.7, create match
            if similarity > 0.7:
                match = Match(
                    item1_id=item.id,
                    item2_id=other_item["id"],
                    similarity_score=float(similarity)
                )
                
                # Save match
                match_dict = match.model_dump()
                match_dict["created_at"] = match_dict["created_at"].isoformat()
                await db.matches.insert_one(match_dict)
                
                # Send email notifications
                background_tasks.add_task(notify_match, item, other_item, similarity)
        except Exception as e:
            logging.error(f"Error processing match: {str(e)}")

async def notify_match(item1: dict, item2: dict, similarity: float):
    try:
        # Notify first user
        if not item1.get("is_anonymous"):
            subject = f"Potential match found for your {item1['type']} item!"
            html = f"""
            <html>
            <body>
                <h2>Great news!</h2>
                <p>We found a potential match for your {item1['type']} item: <strong>{item1['title']}</strong></p>
                <p><strong>Matched Item:</strong> {item2['title']}</p>
                <p><strong>Category:</strong> {item2['category']}</p>
                <p><strong>Location:</strong> {item2['location']}</p>
                <p><strong>Contact:</strong> {item2['user_email'] if not item2.get('is_anonymous') else 'Anonymous user - check portal'}</p>
                <p><strong>Similarity:</strong> {int(similarity * 100)}%</p>
                <p>Visit the LostAF portal to view details and contact the person.</p>
            </body>
            </html>
            """
            send_email(item1["user_email"], subject, html)
        
        # Notify second user
        if not item2.get("is_anonymous"):
            subject = f"Potential match found for your {item2['type']} item!"
            html = f"""
            <html>
            <body>
                <h2>Great news!</h2>
                <p>We found a potential match for your {item2['type']} item: <strong>{item2['title']}</strong></p>
                <p><strong>Matched Item:</strong> {item1['title']}</p>
                <p><strong>Category:</strong> {item1['category']}</p>
                <p><strong>Location:</strong> {item1['location']}</p>
                <p><strong>Contact:</strong> {item1['user_email'] if not item1.get('is_anonymous') else 'Anonymous user - check portal'}</p>
                <p><strong>Similarity:</strong> {int(similarity * 100)}%</p>
                <p>Visit the LostAF portal to view details and contact the person.</p>
            </body>
            </html>
            """
            send_email(item2["user_email"], subject, html)
    except Exception as e:
        logging.error(f"Error sending match notification: {str(e)}")

# ============ Auth Routes ============
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent auth service
    try:
        auth_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session_id")
        
        data = auth_response.json()
        
        # Verify college email
        if not data["email"].endswith("@cvru.ac.in"):
            raise HTTPException(status_code=403, detail="Only @cvru.ac.in emails are allowed")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
        
        if not existing_user:
            # Create new user
            user = User(
                id=data["id"],
                email=data["email"],
                name=data["name"],
                picture=data["picture"]
            )
            user_dict = user.model_dump()
            user_dict["created_at"] = user_dict["created_at"].isoformat()
            await db.users.insert_one(user_dict)
        else:
            user = User(**existing_user)
        
        # Create session
        session = UserSession(
            user_id=user.id,
            session_token=data["session_token"],
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        
        session_dict = session.model_dump()
        session_dict["expires_at"] = session_dict["expires_at"].isoformat()
        session_dict["created_at"] = session_dict["created_at"].isoformat()
        await db.user_sessions.insert_one(session_dict)
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=data["session_token"],
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7*24*60*60
        )
        
        return {"user": user.model_dump(), "session_token": data["session_token"]}
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.get("/auth/me")
async def get_me(user: User = Depends(require_auth)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, user: User = Depends(require_auth)):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie("session_token")
    return {"message": "Logged out successfully"}

# ============ Items Routes ============
@api_router.post("/items")
async def create_item(
    background_tasks: BackgroundTasks,
    type: str = Form(...),
    title: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    date: str = Form(...),
    description: str = Form(...),
    is_anonymous: bool = Form(False),
    image: Optional[UploadFile] = File(None),
    user: User = Depends(require_auth)
):
    # Process image if provided
    image_url = None
    image_embedding = None
    
    if image:
        image_data = await image.read()
        image_url, image_embedding = process_image(image_data)
    
    # Create item
    item = Item(
        type=type,
        title=title,
        category=category,
        location=location,
        date=date,
        description=description,
        image_url=image_url,
        image_embedding=image_embedding,
        user_id=user.id,
        user_name=user.name,
        user_email=user.email,
        is_anonymous=is_anonymous
    )
    
    # Save to database
    item_dict = item.model_dump()
    item_dict["created_at"] = item_dict["created_at"].isoformat()
    await db.items.insert_one(item_dict)
    
    # Find matches in background
    if image_embedding:
        background_tasks.add_task(find_matches, item, background_tasks)
    
    return {"id": item.id, "message": "Item created successfully"}

@api_router.get("/items", response_model=List[ItemResponse])
async def get_items(
    type: Optional[str] = None,
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(require_auth)
):
    query = {"status": "active"}
    
    if type:
        query["type"] = type
    if category:
        query["category"] = category
    if location:
        query["location"] = location
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    items = await db.items.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Convert timestamps
    for item in items:
        if isinstance(item["created_at"], str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
        
        # Get matches for this item
        matches = await db.matches.find({
            "$or": [{"item1_id": item["id"]}, {"item2_id": item["id"]}]
        }, {"_id": 0}).to_list(10)
        
        item["matches"] = []
        for match in matches:
            other_id = match["item2_id"] if match["item1_id"] == item["id"] else match["item1_id"]
            other_item = await db.items.find_one({"id": other_id}, {"_id": 0})
            if other_item:
                item["matches"].append({
                    "id": other_item["id"],
                    "title": other_item["title"],
                    "similarity": match["similarity_score"]
                })
    
    return items

@api_router.get("/items/{item_id}")
async def get_item(item_id: str, user: User = Depends(require_auth)):
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if isinstance(item["created_at"], str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    
    # Get matches
    matches = await db.matches.find({
        "$or": [{"item1_id": item_id}, {"item2_id": item_id}]
    }, {"_id": 0}).to_list(10)
    
    item["matches"] = []
    for match in matches:
        other_id = match["item2_id"] if match["item1_id"] == item_id else match["item1_id"]
        other_item = await db.items.find_one({"id": other_id}, {"_id": 0})
        if other_item:
            item["matches"].append({
                "id": other_item["id"],
                "title": other_item["title"],
                "category": other_item["category"],
                "location": other_item["location"],
                "image_url": other_item.get("image_url"),
                "user_email": other_item["user_email"] if not other_item.get("is_anonymous") else None,
                "similarity": match["similarity_score"]
            })
    
    return item

@api_router.patch("/items/{item_id}/status")
async def update_item_status(
    item_id: str,
    status: str,
    user: User = Depends(require_auth)
):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.items.update_one({"id": item_id}, {"$set": {"status": status}})
    return {"message": "Status updated"}

@api_router.get("/items/user/my-items")
async def get_my_items(user: User = Depends(require_auth)):
    items = await db.items.find({"user_id": user.id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for item in items:
        if isinstance(item["created_at"], str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
    
    return items

# ============ Admin Routes ============
@api_router.get("/admin/stats")
async def get_stats(user: User = Depends(require_auth)):
    total_lost = await db.items.count_documents({"type": "lost", "status": "active"})
    total_found = await db.items.count_documents({"type": "found", "status": "active"})
    total_resolved = await db.items.count_documents({"status": "resolved"})
    total_matches = await db.matches.count_documents({})
    
    return {
        "total_lost": total_lost,
        "total_found": total_found,
        "total_resolved": total_resolved,
        "total_matches": total_matches
    }

@api_router.get("/")
async def root():
    return {"message": "LostAF API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()