import requests
import sys
import json
from datetime import datetime
import os
import base64

# Configuration
BACKEND_URL = "https://findmy-campus-1.preview.emergentagent.com/api"
SESSION_TOKEN = "test_session_1762551709237"
USER_ID = "test-user-1762551709237"
USER_EMAIL = "test.user.1762551709237@cvru.ac.in"

class LostAFTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.session_token = SESSION_TOKEN
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.headers = {
            'Authorization': f'Bearer {self.session_token}'
        }
        self.created_items = []

    def log(self, message, level="INFO"):
        print(f"[{level}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None, is_form_data=False):
        """Run a single API test"""
        url = f"{self.backend_url}/{endpoint}"
        test_headers = self.headers.copy()
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"\n{'='*60}")
        self.log(f"Test {self.tests_run}: {name}")
        self.log(f"{'='*60}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files or is_form_data:
                    # For multipart/form-data, don't set Content-Type (requests will set it with boundary)
                    response = requests.post(url, data=data, files=files, headers=test_headers)
                elif data:
                    test_headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=test_headers)
                else:
                    response = requests.post(url, headers=test_headers)
            elif method == 'PATCH':
                test_headers['Content-Type'] = 'application/json'
                response = requests.patch(url, json=data, headers=test_headers)

            self.log(f"Request: {method} {url}")
            self.log(f"Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Expected {expected_status}, got {response.status_code}", "SUCCESS")
                try:
                    response_data = response.json()
                    self.log(f"Response: {json.dumps(response_data, indent=2)[:500]}")
                    return True, response_data
                except:
                    return True, {}
            else:
                self.log(f"❌ FAILED - Expected {expected_status}, got {response.status_code}", "ERROR")
                try:
                    error_data = response.json()
                    self.log(f"Error Response: {json.dumps(error_data, indent=2)}")
                except:
                    self.log(f"Error Response: {response.text[:500]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })
                return False, {}

        except Exception as e:
            self.log(f"❌ FAILED - Exception: {str(e)}", "ERROR")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_auth_me(self):
        """Test GET /auth/me"""
        success, data = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        if success:
            self.log(f"User authenticated: {data.get('email')}")
        return success

    def test_auth_me_without_token(self):
        """Test GET /auth/me without token"""
        success, _ = self.run_test(
            "Get Current User (No Token)",
            "GET",
            "auth/me",
            401,
            headers={'Authorization': ''}
        )
        return success

    def test_create_lost_item_with_image(self):
        """Test POST /items with image"""
        # Create a simple test image (1x1 red pixel PNG)
        test_image_data = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
        )
        
        files = {
            'image': ('test_lost.png', test_image_data, 'image/png')
        }
        
        data = {
            'type': 'lost',
            'title': 'Test Lost Wallet',
            'category': 'Wallet',
            'location': 'Library',
            'date': '2025-01-07',
            'description': 'Black leather wallet with ID cards',
            'is_anonymous': 'false'
        }
        
        success, response = self.run_test(
            "Create Lost Item with Image",
            "POST",
            "items",
            200,
            data=data,
            files=files
        )
        
        if success and 'id' in response:
            self.created_items.append(response['id'])
            self.log(f"Created item ID: {response['id']}")
        
        return success

    def test_create_found_item_with_image(self):
        """Test POST /items (found) with image"""
        # Create a similar test image
        test_image_data = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
        )
        
        files = {
            'image': ('test_found.png', test_image_data, 'image/png')
        }
        
        data = {
            'type': 'found',
            'title': 'Test Found Wallet',
            'category': 'Wallet',
            'location': 'Library',
            'date': '2025-01-07',
            'description': 'Found a black wallet near the entrance',
            'is_anonymous': 'false'
        }
        
        success, response = self.run_test(
            "Create Found Item with Image",
            "POST",
            "items",
            200,
            data=data,
            files=files
        )
        
        if success and 'id' in response:
            self.created_items.append(response['id'])
            self.log(f"Created item ID: {response['id']}")
        
        return success

    def test_create_item_without_image(self):
        """Test POST /items without image"""
        data = {
            'type': 'lost',
            'title': 'Test Lost Keys',
            'category': 'Keys',
            'location': 'Canteen',
            'date': '2025-01-07',
            'description': 'Set of keys with blue keychain',
            'is_anonymous': 'false'
        }
        
        success, response = self.run_test(
            "Create Item without Image",
            "POST",
            "items",
            200,
            data=data,
            is_form_data=True
        )
        
        if success and 'id' in response:
            self.created_items.append(response['id'])
        
        return success

    def test_get_all_items(self):
        """Test GET /items"""
        success, data = self.run_test(
            "Get All Items",
            "GET",
            "items",
            200
        )
        
        if success:
            self.log(f"Total items retrieved: {len(data)}")
        
        return success

    def test_get_items_with_filters(self):
        """Test GET /items with filters"""
        success, data = self.run_test(
            "Get Items (Filter: type=lost)",
            "GET",
            "items?type=lost",
            200
        )
        
        if success:
            self.log(f"Lost items retrieved: {len(data)}")
        
        return success

    def test_get_items_with_search(self):
        """Test GET /items with search"""
        success, data = self.run_test(
            "Get Items (Search: wallet)",
            "GET",
            "items?search=wallet",
            200
        )
        
        if success:
            self.log(f"Search results: {len(data)}")
        
        return success

    def test_get_item_details(self):
        """Test GET /items/{id}"""
        if not self.created_items:
            self.log("No items created, skipping test", "WARNING")
            return True
        
        item_id = self.created_items[0]
        success, data = self.run_test(
            "Get Item Details",
            "GET",
            f"items/{item_id}",
            200
        )
        
        if success:
            self.log(f"Item title: {data.get('title')}")
            self.log(f"Item matches: {len(data.get('matches', []))}")
        
        return success

    def test_get_my_items(self):
        """Test GET /items/user/my-items"""
        success, data = self.run_test(
            "Get My Items",
            "GET",
            "items/user/my-items",
            200
        )
        
        if success:
            self.log(f"My items count: {len(data)}")
        
        return success

    def test_update_item_status(self):
        """Test PATCH /items/{id}/status"""
        if not self.created_items:
            self.log("No items created, skipping test", "WARNING")
            return True
        
        item_id = self.created_items[0]
        success, _ = self.run_test(
            "Update Item Status",
            "PATCH",
            f"items/{item_id}/status?status=resolved",
            200
        )
        
        return success

    def test_admin_stats(self):
        """Test GET /admin/stats"""
        success, data = self.run_test(
            "Get Admin Statistics",
            "GET",
            "admin/stats",
            200
        )
        
        if success:
            self.log(f"Stats: Lost={data.get('total_lost')}, Found={data.get('total_found')}, Resolved={data.get('total_resolved')}, Matches={data.get('total_matches')}")
        
        return success

    def test_logout(self):
        """Test POST /auth/logout"""
        success, _ = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        return success

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"\n{i}. {test['test']}")
                print(f"   Endpoint: {test['endpoint']}")
                if 'expected' in test:
                    print(f"   Expected: {test['expected']}, Got: {test['actual']}")
                if 'error' in test:
                    print(f"   Error: {test['error']}")
        
        print("\n" + "="*60)

def main():
    print("="*60)
    print("LostAF Backend API Testing")
    print("="*60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Session Token: {SESSION_TOKEN[:20]}...")
    print(f"User Email: {USER_EMAIL}")
    print("="*60)
    
    tester = LostAFTester()
    
    # Run all tests
    tester.test_auth_me()
    tester.test_auth_me_without_token()
    tester.test_create_lost_item_with_image()
    tester.test_create_found_item_with_image()
    tester.test_create_item_without_image()
    tester.test_get_all_items()
    tester.test_get_items_with_filters()
    tester.test_get_items_with_search()
    tester.test_get_item_details()
    tester.test_get_my_items()
    tester.test_update_item_status()
    tester.test_admin_stats()
    tester.test_logout()
    
    # Print summary
    tester.print_summary()
    
    # Return exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
