#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Mushroom Finder App
Tests all CRUD operations and nearby search functionality
"""

import requests
import json
import sys
from datetime import datetime

# Use the production URL from frontend/.env
BASE_URL = "https://shroomspot.preview.emergentagent.com/api"

# Test data as specified in the review request
TEST_MUSHROOM_DATA = [
    {
        "latitude": 47.6062,
        "longitude": -122.3321,
        "mushroom_type": "Chanterelle",
        "notes": "Found under oak trees",
        "photo_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    },
    {
        "latitude": 47.6100,
        "longitude": -122.3350,
        "mushroom_type": "Porcini",
        "notes": "Large cluster",
        "photo_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    },
    {
        "latitude": 47.6080,
        "longitude": -122.3300,
        "mushroom_type": "Oyster Mushroom",
        "notes": "Growing on fallen log",
        "photo_base64": None  # Test without photo
    }
]

class MushroomAPITester:
    def __init__(self):
        self.created_spot_ids = []
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log_result(self, test_name, success, message="", response=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if response and not success:
            print(f"   Response: {response.status_code} - {response.text[:200]}")
        
        if success:
            self.test_results["passed"] += 1
        else:
            self.test_results["failed"] += 1
            self.test_results["errors"].append(f"{test_name}: {message}")
        print()

    def test_api_health_check(self):
        """Test 1: Basic API health check - GET /api/"""
        try:
            response = requests.get(f"{BASE_URL}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Mushroom Finder API" in data["message"]:
                    self.log_result("API Health Check", True, f"API is responding correctly: {data['message']}")
                    return True
                else:
                    self.log_result("API Health Check", False, f"Unexpected response format: {data}")
                    return False
            else:
                self.log_result("API Health Check", False, f"HTTP {response.status_code}", response)
                return False
                
        except Exception as e:
            self.log_result("API Health Check", False, f"Connection error: {str(e)}")
            return False

    def test_create_mushroom_spot(self, test_data):
        """Test 2: Create mushroom spot - POST /api/mushroom-spots"""
        try:
            response = requests.post(
                f"{BASE_URL}/mushroom-spots",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "latitude", "longitude", "mushroom_type", "timestamp"]
                
                if all(field in data for field in required_fields):
                    # Verify data matches input
                    if (data["latitude"] == test_data["latitude"] and 
                        data["longitude"] == test_data["longitude"] and
                        data["mushroom_type"] == test_data["mushroom_type"]):
                        
                        self.created_spot_ids.append(data["id"])
                        self.log_result("Create Mushroom Spot", True, 
                                      f"Created spot with ID: {data['id']}, Type: {data['mushroom_type']}")
                        return data["id"]
                    else:
                        self.log_result("Create Mushroom Spot", False, "Data mismatch in response")
                        return None
                else:
                    self.log_result("Create Mushroom Spot", False, f"Missing required fields in response: {data}")
                    return None
            else:
                self.log_result("Create Mushroom Spot", False, f"HTTP {response.status_code}", response)
                return None
                
        except Exception as e:
            self.log_result("Create Mushroom Spot", False, f"Request error: {str(e)}")
            return None

    def test_get_all_mushroom_spots(self):
        """Test 3: Get all mushroom spots - GET /api/mushroom-spots"""
        try:
            response = requests.get(f"{BASE_URL}/mushroom-spots", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get All Mushroom Spots", True, 
                                  f"Retrieved {len(data)} mushroom spots")
                    return data
                else:
                    self.log_result("Get All Mushroom Spots", False, "Response is not a list")
                    return None
            else:
                self.log_result("Get All Mushroom Spots", False, f"HTTP {response.status_code}", response)
                return None
                
        except Exception as e:
            self.log_result("Get All Mushroom Spots", False, f"Request error: {str(e)}")
            return None

    def test_get_specific_mushroom_spot(self, spot_id):
        """Test 4: Get specific mushroom spot - GET /api/mushroom-spots/{spot_id}"""
        try:
            response = requests.get(f"{BASE_URL}/mushroom-spots/{spot_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == spot_id:
                    self.log_result("Get Specific Mushroom Spot", True, 
                                  f"Retrieved spot: {data['mushroom_type']} at ({data['latitude']}, {data['longitude']})")
                    return data
                else:
                    self.log_result("Get Specific Mushroom Spot", False, "ID mismatch in response")
                    return None
            elif response.status_code == 404:
                self.log_result("Get Specific Mushroom Spot", False, "Spot not found (404)")
                return None
            else:
                self.log_result("Get Specific Mushroom Spot", False, f"HTTP {response.status_code}", response)
                return None
                
        except Exception as e:
            self.log_result("Get Specific Mushroom Spot", False, f"Request error: {str(e)}")
            return None

    def test_update_mushroom_spot(self, spot_id):
        """Test 5: Update mushroom spot - PUT /api/mushroom-spots/{spot_id}"""
        try:
            update_data = {
                "mushroom_type": "Updated Chanterelle",
                "notes": "Updated notes - found in different location"
            }
            
            response = requests.put(
                f"{BASE_URL}/mushroom-spots/{spot_id}",
                json=update_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("mushroom_type") == update_data["mushroom_type"] and 
                    data.get("notes") == update_data["notes"]):
                    self.log_result("Update Mushroom Spot", True, 
                                  f"Updated spot successfully: {data['mushroom_type']}")
                    return data
                else:
                    self.log_result("Update Mushroom Spot", False, "Update data not reflected in response")
                    return None
            elif response.status_code == 404:
                self.log_result("Update Mushroom Spot", False, "Spot not found for update (404)")
                return None
            else:
                self.log_result("Update Mushroom Spot", False, f"HTTP {response.status_code}", response)
                return None
                
        except Exception as e:
            self.log_result("Update Mushroom Spot", False, f"Request error: {str(e)}")
            return None

    def test_nearby_mushroom_spots(self, latitude, longitude):
        """Test 6: Get nearby mushroom spots - GET /api/mushroom-spots/nearby/{lat}/{lon}"""
        try:
            response = requests.get(
                f"{BASE_URL}/mushroom-spots/nearby/{latitude}/{longitude}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Nearby Mushroom Spots", True, 
                                  f"Found {len(data)} nearby spots within default radius")
                    return data
                else:
                    self.log_result("Get Nearby Mushroom Spots", False, "Response is not a list")
                    return None
            else:
                self.log_result("Get Nearby Mushroom Spots", False, f"HTTP {response.status_code}", response)
                return None
                
        except Exception as e:
            self.log_result("Get Nearby Mushroom Spots", False, f"Request error: {str(e)}")
            return None

    def test_delete_mushroom_spot(self, spot_id):
        """Test 7: Delete mushroom spot - DELETE /api/mushroom-spots/{spot_id}"""
        try:
            response = requests.delete(f"{BASE_URL}/mushroom-spots/{spot_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "deleted" in data["message"].lower():
                    self.log_result("Delete Mushroom Spot", True, f"Deleted spot successfully: {data['message']}")
                    return True
                else:
                    self.log_result("Delete Mushroom Spot", False, f"Unexpected delete response: {data}")
                    return False
            elif response.status_code == 404:
                self.log_result("Delete Mushroom Spot", False, "Spot not found for deletion (404)")
                return False
            else:
                self.log_result("Delete Mushroom Spot", False, f"HTTP {response.status_code}", response)
                return False
                
        except Exception as e:
            self.log_result("Delete Mushroom Spot", False, f"Request error: {str(e)}")
            return False

    def test_error_handling(self):
        """Test 8: Error handling for non-existent resources"""
        fake_id = "non-existent-id-12345"
        
        # Test GET non-existent spot
        try:
            response = requests.get(f"{BASE_URL}/mushroom-spots/{fake_id}", timeout=10)
            if response.status_code == 404:
                self.log_result("Error Handling - GET Non-existent", True, "Correctly returned 404 for non-existent spot")
            else:
                self.log_result("Error Handling - GET Non-existent", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("Error Handling - GET Non-existent", False, f"Request error: {str(e)}")

        # Test DELETE non-existent spot
        try:
            response = requests.delete(f"{BASE_URL}/mushroom-spots/{fake_id}", timeout=10)
            if response.status_code == 404:
                self.log_result("Error Handling - DELETE Non-existent", True, "Correctly returned 404 for non-existent spot")
            else:
                self.log_result("Error Handling - DELETE Non-existent", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("Error Handling - DELETE Non-existent", False, f"Request error: {str(e)}")

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("=" * 60)
        print("MUSHROOM FINDER API COMPREHENSIVE TEST SUITE")
        print("=" * 60)
        print(f"Testing against: {BASE_URL}")
        print(f"Test started at: {datetime.now()}")
        print()

        # Test 1: API Health Check
        if not self.test_api_health_check():
            print("❌ API is not responding. Stopping tests.")
            return self.test_results

        # Test 2-3: Create multiple mushroom spots and verify creation
        created_ids = []
        for i, test_data in enumerate(TEST_MUSHROOM_DATA):
            print(f"Creating test spot {i+1}/3...")
            spot_id = self.test_create_mushroom_spot(test_data)
            if spot_id:
                created_ids.append(spot_id)

        if not created_ids:
            print("❌ No spots were created successfully. Stopping CRUD tests.")
        else:
            # Test 4: Get all spots
            all_spots = self.test_get_all_mushroom_spots()
            
            # Test 5: Get specific spot
            if created_ids:
                self.test_get_specific_mushroom_spot(created_ids[0])
            
            # Test 6: Update spot
            if created_ids:
                self.test_update_mushroom_spot(created_ids[0])
            
            # Test 7: Nearby search
            self.test_nearby_mushroom_spots(47.6062, -122.3321)

        # Test 8: Error handling
        self.test_error_handling()

        # Test 9: Cleanup - Delete created spots
        print("Cleaning up created test data...")
        for spot_id in created_ids:
            self.test_delete_mushroom_spot(spot_id)

        # Final results
        print("=" * 60)
        print("TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        print(f"Total Tests: {self.test_results['passed'] + self.test_results['failed']}")
        
        if self.test_results['errors']:
            print("\nFAILED TESTS:")
            for error in self.test_results['errors']:
                print(f"  - {error}")
        
        success_rate = (self.test_results['passed'] / (self.test_results['passed'] + self.test_results['failed'])) * 100
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        return self.test_results

if __name__ == "__main__":
    tester = MushroomAPITester()
    results = tester.run_comprehensive_test()
    
    # Exit with error code if tests failed
    if results['failed'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)