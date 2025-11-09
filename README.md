# LostAF — College Lost & Found Portal

LostAF is a lightweight web portal for college campuses to report, search, and recover lost & found items. It includes user authentication (college email), anonymous posting, image-based AI similarity matching (CLIP), automatic matching & notification, and an admin dashboard for moderation and stats.

This README explains how the project is organized, the environment variables you need, how to run the backend and frontend locally, how to run the included API test script, and troubleshooting tips.

## Project structure (important files)

- `backend/` — FastAPI backend and ML matching code (`server.py`) and `requirements.txt`.
- `frontend/` — React (Create React App + CRACO) frontend under `src/`.
- `backend_test.py` — a small test runner that exercises the API endpoints (uses an external preview backend by default).

## Key features implemented

- User session authentication via external session service (only allows college emails, e.g. `@cvru.ac.in`).
- Post lost/found items with optional image and description.
- Anonymous posting option.
- Image embedding + similarity matching using a CLIP-like model (`sentence-transformers` `clip-ViT-B-32`).
- Automatic match generation and email notifications (SendGrid).
- Basic admin statistics dashboard.

## Quick status notes

- The backend Python code compiles (no syntax errors found by `python -m py_compile backend/server.py`).
- Runtime depends on several environment variables and external services (MongoDB, external auth endpoint, SendGrid, model download). See below for details.

## Prerequisites

- Python 3.10+ (3.11 recommended)
- Node.js + Yarn (frontend uses Yarn in `package.json`)
- MongoDB instance (local or hosted)
- Internet connection for downloading Python packages and the CLIP model on first run

## Required environment variables

Create a `.env` file in `backend/` or export these values in your environment.

- `MONGO_URL` — MongoDB connection string (e.g. `mongodb://localhost:27017`).
- `DB_NAME` — Database name used by the app (e.g. `lostaf`).
- `SENDGRID_API_KEY` — (optional) SendGrid API key for sending emails. If not provided, email attempts will fail but the server will continue (errors are logged).
- `SENDER_EMAIL` — Sender email used for notifications (required if you enable SendGrid).
- `CORS_ORIGINS` — Comma-separated list of allowed origins for CORS (optional, defaults to `*`).
 - `RECAPTCHA_SECRET` — (optional) Google reCAPTCHA secret key (backend). If provided, the backend will verify captcha tokens submitted from the frontend.
 - `FRONTEND_URL` — (optional) Base URL of the frontend (used when generating QR codes). Defaults to `http://localhost:3000`.

Frontend config:
- `REACT_APP_BACKEND_URL` — base backend URL (e.g. `http://localhost:8000`). Export this before running the frontend.
 - `REACT_APP_RECAPTCHA_SITE_KEY` — (optional) Google reCAPTCHA site key (frontend). If provided, the Post Item form will attempt to obtain a reCAPTCHA token and send it to the backend.

## Running the backend (local dev)

1. Open PowerShell and go to the backend folder:

```powershell
cd d:\LostAF\backend
```

2. Create and activate a virtual environment (recommended):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

3. Install dependencies (this may take a long time because of ML libraries):

```powershell
pip install -r requirements.txt
```

4. Ensure your `.env` or environment variables are set. Example for PowerShell:

```powershell
$env:MONGO_URL = 'mongodb://localhost:27017'
$env:DB_NAME = 'lostaf'
$env:SENDGRID_API_KEY = 'SG.YOUR_KEY'
$env:SENDER_EMAIL = 'noreply@yourdomain'
$env:CORS_ORIGINS = 'http://localhost:3000'
```

5. Start the backend using Uvicorn:

```powershell
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

Notes:
- On first run, `sentence-transformers` will download the `clip-ViT-B-32` model which requires network and disk space.
- If you can't or don't want to send real emails during testing, leave `SENDGRID_API_KEY` unset and treat email failures as non-blocking.

## Running the frontend (local dev)

1. Open PowerShell and go to the frontend folder:

```powershell
cd d:\LostAF\frontend
```

2. Install dependencies and start (uses Yarn as configured):

```powershell
yarn install
$env:REACT_APP_BACKEND_URL = 'http://localhost:8000'
yarn start
```

3. Visit `http://localhost:3000` in your browser.

## Quick health checks

- Backend root check (after backend started):

```powershell
Invoke-RestMethod 'http://localhost:8000/api/'
# Expected: {"message":"LostAF API"}
```

- From the frontend (App.js) `REACT_APP_BACKEND_URL` should point to the running backend.

## Running the test script

- `backend_test.py` is an API test script that, by default, contains a `BACKEND_URL` pointing to a preview external URL. You can edit `backend_test.py` to point to `http://localhost:8000/api` to run tests against your local server.

To run the script:

```powershell
python d:\LostAF\backend_test.py
```

Notes: The test harness expects a session token and mock user values; if testing locally you might need to adjust the script or create a session in the DB.

## Important caveats & troubleshooting

- Environment variables missing -> server will raise KeyError at import time. Ensure at least `MONGO_URL` and `DB_NAME` are set before starting.
- Model download: `sentence-transformers` will download models on first run. If your machine has limited memory or disk, this may fail. Errors from the model will show in logs when `model.encode(...)` is called.
- Torch/CUDA: the repository requests a CPU wheel in requirements, but torch install can still be heavy. If you encounter binary compatibility issues, install a torch wheel matching your Python and OS from the official PyTorch instructions.
- SendGrid failures: if `SENDGRID_API_KEY` is invalid or not set, email sending will error; the server logs these errors but continues running.
- Mongo connectivity: verify `MONGO_URL` can be reached and the DB is accessible. On connection errors, the app will raise exceptions when trying to access `db`.

## Notes on privacy and safety

- Anonymous posting is supported. When `is_anonymous` is set posts will not expose user email in the UI or in notification emails.
---

License: All rights are not resereved but please do not copy

