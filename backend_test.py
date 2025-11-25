#!/usr/bin/env python3
"""
URGENT PRIVACY REGRESSION TESTING
Testing critical privacy issue where users see spots that aren't theirs
"""

import requests
import json
import uuid
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://mushroom-locator.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.test_results = []
        self.created_spots = []  # Track created spots for cleanup
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def test_api_health(self):
        """Test API health check"""
        try:
            response = requests.get(f"{BACKEND_URL}/", timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json()}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, f"Error: {str(e)}")
            return False
    
    def test_create_spot_with_user_id(self):
        """Test 1: Create spot with user_id"""
        try:
            user_id = f"user_{uuid.uuid4().hex[:8]}"
            spot_data = {
                "latitude": 45.7640,
                "longitude": 4.8357,
                "mushroom_type": "Cèpe de Bordeaux",
                "notes": "Found near oak trees, perfect specimen for UUID testing",
                "user_id": user_id,
                "photo_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            }
            
            response = requests.post(f"{BACKEND_URL}/mushroom-spots", 
                                   json=spot_data, timeout=30)
            
            if response.status_code == 200:
                spot = response.json()
                self.created_spots.append(spot["id"])
                success = (spot["user_id"] == user_id and 
                          spot["mushroom_type"] == "Cèpe de Bordeaux")
                details = f"Created spot ID: {spot['id']}, user_id: {spot['user_id']}"
                self.log_test("Create spot with user_id", success, details)
                return success, user_id, spot["id"]
            else:
                self.log_test("Create spot with user_id", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False, None, None
                
        except Exception as e:
            self.log_test("Create spot with user_id", False, f"Error: {str(e)}")
            return False, None, None
    
    def test_retrieve_spots_by_user_id(self, user_id):
        """Test 2: Retrieve spots filtered by user_id"""
        try:
            response = requests.get(f"{BACKEND_URL}/mushroom-spots?user_id={user_id}", 
                                  timeout=30)
            
            if response.status_code == 200:
                spots = response.json()
                success = len(spots) > 0 and all(spot["user_id"] == user_id for spot in spots)
                details = f"Found {len(spots)} spots for user_id: {user_id}"
                self.log_test("Retrieve spots by user_id", success, details)
                return success
            else:
                self.log_test("Retrieve spots by user_id", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Retrieve spots by user_id", False, f"Error: {str(e)}")
            return False
    
    def test_user_privacy_verification(self):
        """Test 3: user_id privacy verification"""
        try:
            # Create spots for two different users
            user_a_id = f"user_a_{uuid.uuid4().hex[:8]}"
            user_b_id = f"user_b_{uuid.uuid4().hex[:8]}"
            
            # Create spot for user A
            spot_a_data = {
                "latitude": 45.7640,
                "longitude": 4.8357,
                "mushroom_type": "Girolle User A",
                "notes": "Private spot for user A",
                "user_id": user_a_id
            }
            
            response_a = requests.post(f"{BACKEND_URL}/mushroom-spots", 
                                     json=spot_a_data, timeout=30)
            
            # Create spot for user B
            spot_b_data = {
                "latitude": 45.7650,
                "longitude": 4.8367,
                "mushroom_type": "Morille User B",
                "notes": "Private spot for user B",
                "user_id": user_b_id
            }
            
            response_b = requests.post(f"{BACKEND_URL}/mushroom-spots", 
                                     json=spot_b_data, timeout=30)
            
            if response_a.status_code == 200 and response_b.status_code == 200:
                spot_a = response_a.json()
                spot_b = response_b.json()
                self.created_spots.extend([spot_a["id"], spot_b["id"]])
                
                # Request spots for user A - should only get user A's spots
                response = requests.get(f"{BACKEND_URL}/mushroom-spots?user_id={user_a_id}", 
                                      timeout=30)
                
                if response.status_code == 200:
                    user_a_spots = response.json()
                    # Verify user A only sees their own spots
                    success = (len(user_a_spots) > 0 and 
                             all(spot["user_id"] == user_a_id for spot in user_a_spots) and
                             not any(spot["user_id"] == user_b_id for spot in user_a_spots))
                    
                    details = f"User A sees {len(user_a_spots)} spots, all belong to user A"
                    self.log_test("User privacy verification", success, details)
                    return success
                else:
                    self.log_test("User privacy verification", False, 
                                f"Failed to retrieve user A spots: {response.status_code}")
                    return False
            else:
                self.log_test("User privacy verification", False, 
                            "Failed to create test spots for privacy verification")
                return False
                
        except Exception as e:
            self.log_test("User privacy verification", False, f"Error: {str(e)}")
            return False
    
    def test_backwards_compatibility_created_by(self):
        """Test 4: Backwards compatibility with created_by"""
        try:
            # Create a spot with both user_id and created_by (legacy)
            user_id = f"user_{uuid.uuid4().hex[:8]}"
            created_by = "TestUserLegacy"
            
            spot_data = {
                "latitude": 45.7660,
                "longitude": 4.8377,
                "mushroom_type": "Champignon Legacy",
                "notes": "Testing backwards compatibility",
                "user_id": user_id,
                "created_by": created_by
            }
            
            response = requests.post(f"{BACKEND_URL}/mushroom-spots", 
                                   json=spot_data, timeout=30)
            
            if response.status_code == 200:
                spot = response.json()
                self.created_spots.append(spot["id"])
                
                # Test legacy created_by parameter
                response = requests.get(f"{BACKEND_URL}/mushroom-spots?created_by={created_by}", 
                                      timeout=30)
                
                if response.status_code == 200:
                    spots = response.json()
                    success = len(spots) > 0 and any(spot["created_by"] == created_by for spot in spots)
                    details = f"Found {len(spots)} spots using legacy created_by parameter"
                    self.log_test("Backwards compatibility with created_by", success, details)
                    return success
                else:
                    self.log_test("Backwards compatibility with created_by", False, 
                                f"Failed to retrieve by created_by: {response.status_code}")
                    return False
            else:
                self.log_test("Backwards compatibility with created_by", False, 
                            f"Failed to create spot: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Backwards compatibility with created_by", False, f"Error: {str(e)}")
            return False
    
    def test_user_id_precedence(self):
        """Test 5: user_id takes precedence over created_by"""
        try:
            # Create spots with different user_id and created_by combinations
            user_id_1 = f"user_precedence_{uuid.uuid4().hex[:8]}"
            user_id_2 = f"user_precedence_{uuid.uuid4().hex[:8]}"
            created_by = "SharedLegacyUser"
            
            # Create spot 1 with user_id_1
            spot_1_data = {
                "latitude": 45.7670,
                "longitude": 4.8387,
                "mushroom_type": "Precedence Test 1",
                "notes": "Testing precedence - spot 1",
                "user_id": user_id_1,
                "created_by": created_by
            }
            
            # Create spot 2 with user_id_2 but same created_by
            spot_2_data = {
                "latitude": 45.7680,
                "longitude": 4.8397,
                "mushroom_type": "Precedence Test 2",
                "notes": "Testing precedence - spot 2",
                "user_id": user_id_2,
                "created_by": created_by
            }
            
            response_1 = requests.post(f"{BACKEND_URL}/mushroom-spots", 
                                     json=spot_1_data, timeout=30)
            response_2 = requests.post(f"{BACKEND_URL}/mushroom-spots", 
                                     json=spot_2_data, timeout=30)
            
            if response_1.status_code == 200 and response_2.status_code == 200:
                spot_1 = response_1.json()
                spot_2 = response_2.json()
                self.created_spots.extend([spot_1["id"], spot_2["id"]])
                
                # Request with both user_id and created_by - user_id should take precedence
                response = requests.get(f"{BACKEND_URL}/mushroom-spots?user_id={user_id_1}&created_by={created_by}", 
                                      timeout=30)
                
                if response.status_code == 200:
                    spots = response.json()
                    # Should only return spots with user_id_1, not all spots with created_by
                    success = (len(spots) > 0 and 
                             all(spot["user_id"] == user_id_1 for spot in spots) and
                             not any(spot["user_id"] == user_id_2 for spot in spots))
                    
                    details = f"Found {len(spots)} spots, all with user_id: {user_id_1} (precedence working)"
                    self.log_test("user_id takes precedence over created_by", success, details)
                    return success
                else:
                    self.log_test("user_id takes precedence over created_by", False, 
                                f"Failed to retrieve spots: {response.status_code}")
                    return False
            else:
                self.log_test("user_id takes precedence over created_by", False, 
                            "Failed to create test spots")
                return False
                
        except Exception as e:
            self.log_test("user_id takes precedence over created_by", False, f"Error: {str(e)}")
            return False
    
    def test_error_handling_missing_user_id(self):
        """Test 6: Error handling - POST without user_id should fail"""
        try:
            # Try to create spot without user_id (should fail)
            spot_data = {
                "latitude": 45.7690,
                "longitude": 4.8407,
                "mushroom_type": "Invalid Spot",
                "notes": "This should fail - no user_id",
                "created_by": "TestUser"
            }
            
            response = requests.post(f"{BACKEND_URL}/mushroom-spots", 
                                   json=spot_data, timeout=30)
            
            # Should fail with 422 (validation error) since user_id is required
            success = response.status_code in [400, 422]
            details = f"Status: {response.status_code} (expected 400/422 for missing user_id)"
            self.log_test("Error handling - missing user_id", success, details)
            return success
                
        except Exception as e:
            self.log_test("Error handling - missing user_id", False, f"Error: {str(e)}")
            return False
    
    def cleanup_test_data(self):
        """Clean up created test spots"""
        print("\n🧹 Cleaning up test data...")
        cleaned = 0
        for spot_id in self.created_spots:
            try:
                response = requests.delete(f"{BACKEND_URL}/mushroom-spots/{spot_id}", timeout=30)
                if response.status_code == 200:
                    cleaned += 1
            except Exception as e:
                print(f"   Failed to delete spot {spot_id}: {str(e)}")
        
        print(f"   Cleaned up {cleaned}/{len(self.created_spots)} test spots")
    
    def run_all_tests(self):
        """Run all UUID-based user identification tests"""
        print("🧪 Starting UUID-based User Identification System Tests")
        print("=" * 60)
        
        # Test 0: API Health Check
        if not self.test_api_health():
            print("❌ API not available, stopping tests")
            return False
        
        # Test 1: Create spot with user_id
        success_1, test_user_id, test_spot_id = self.test_create_spot_with_user_id()
        
        # Test 2: Retrieve spots by user_id (using the user_id from test 1)
        success_2 = False
        if success_1 and test_user_id:
            success_2 = self.test_retrieve_spots_by_user_id(test_user_id)
        
        # Test 3: User privacy verification
        success_3 = self.test_user_privacy_verification()
        
        # Test 4: Backwards compatibility with created_by
        success_4 = self.test_backwards_compatibility_created_by()
        
        # Test 5: user_id takes precedence over created_by
        success_5 = self.test_user_id_precedence()
        
        # Test 6: Error handling - missing user_id
        success_6 = self.test_error_handling_missing_user_id()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
        
        print(f"\n🎯 OVERALL RESULT: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("✅ ALL UUID-BASED USER IDENTIFICATION TESTS PASSED!")
            return True
        else:
            print("❌ SOME TESTS FAILED - UUID system needs attention")
            return False

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)