#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Mushroom Finder App
Tests all CRUD operations and nearby search functionality
"""

import requests
import json
import sys
from datetime import datetime

# Use the frontend environment variable for backend URL
BASE_URL = "https://myco-finder.preview.emergentagent.com/api"

# Test data as specified in the review request
TEST_MUSHROOM_DATA = [
    {
        "latitude": 48.8566,
        "longitude": 2.3522,
        "mushroom_type": "Test Champignon",
        "notes": "Test depuis Render",
        "photo_base64": None
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
        self.created_mushroom_id = None
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

    # NEW MUSHROOM DATABASE TESTING METHODS
    def test_get_all_mushrooms(self):
        """Test: GET /api/mushrooms - Get all mushrooms"""
        try:
            response = requests.get(f"{BASE_URL}/mushrooms", timeout=10)
            if response.status_code == 200:
                mushrooms = response.json()
                if isinstance(mushrooms, list):
                    self.log_result("GET All Mushrooms", True, 
                                  f"Retrieved {len(mushrooms)} mushrooms from database")
                    return mushrooms
                else:
                    self.log_result("GET All Mushrooms", False, f"Expected list, got {type(mushrooms)}")
                    return None
            else:
                self.log_result("GET All Mushrooms", False, f"HTTP {response.status_code}", response)
                return None
        except Exception as e:
            self.log_result("GET All Mushrooms", False, f"Request error: {str(e)}")
            return None

    def test_search_mushrooms(self, search_term):
        """Test: GET /api/mushrooms?search=term - Search mushrooms"""
        try:
            response = requests.get(f"{BASE_URL}/mushrooms?search={search_term}", timeout=10)
            if response.status_code == 200:
                mushrooms = response.json()
                if isinstance(mushrooms, list):
                    self.log_result(f"Search Mushrooms - '{search_term}'", True, 
                                  f"Search returned {len(mushrooms)} results")
                    return mushrooms
                else:
                    self.log_result(f"Search Mushrooms - '{search_term}'", False, f"Expected list, got {type(mushrooms)}")
                    return None
            else:
                self.log_result(f"Search Mushrooms - '{search_term}'", False, f"HTTP {response.status_code}", response)
                return None
        except Exception as e:
            self.log_result(f"Search Mushrooms - '{search_term}'", False, f"Request error: {str(e)}")
            return None

    def test_create_mushroom(self):
        """Test: POST /api/mushrooms - Create new mushroom entry"""
        test_mushroom_data = {
            "common_name": "Cèpe de Bordeaux",
            "latin_name": "Boletus edulis",
            "edibility": "comestible",
            "season": "Été-Automne",
            "description": "Le cèpe de Bordeaux est un champignon très apprécié en cuisine. Son chapeau est brun et son pied est massif et blanc.",
            "characteristics": [
                "Chapeau brun foncé",
                "Pied blanc et massif",
                "Chair blanche et ferme",
                "Tubes blancs puis jaune-vert"
            ],
            "habitat": "Forêts de feuillus et de conifères, particulièrement sous les chênes",
            "lookalikes": [
                {
                    "name": "Bolet amer",
                    "latin_name": "Tylopilus felleus",
                    "difference": "Chair très amère, pores roses",
                    "danger_level": "non_comestible"
                }
            ],
            "photo_urls": [
                "https://example.com/cepe1.jpg",
                "https://example.com/cepe2.jpg"
            ]
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/mushrooms",
                json=test_mushroom_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                created_mushroom = response.json()
                required_fields = ["id", "common_name", "latin_name", "edibility", "season"]
                
                if all(field in created_mushroom for field in required_fields):
                    if created_mushroom["common_name"] == test_mushroom_data["common_name"]:
                        self.created_mushroom_id = created_mushroom["id"]
                        self.log_result("Create Mushroom", True, 
                                      f"Created mushroom with ID: {self.created_mushroom_id}")
                        return created_mushroom["id"]
                    else:
                        self.log_result("Create Mushroom", False, "Data mismatch in response")
                        return None
                else:
                    self.log_result("Create Mushroom", False, f"Missing required fields in response")
                    return None
            else:
                self.log_result("Create Mushroom", False, f"HTTP {response.status_code}", response)
                return None
        except Exception as e:
            self.log_result("Create Mushroom", False, f"Request error: {str(e)}")
            return None

    def test_get_specific_mushroom(self, mushroom_id):
        """Test: GET /api/mushrooms/{mushroom_id} - Get specific mushroom"""
        try:
            response = requests.get(f"{BASE_URL}/mushrooms/{mushroom_id}", timeout=10)
            
            if response.status_code == 200:
                mushroom = response.json()
                if mushroom.get("id") == mushroom_id:
                    self.log_result("Get Specific Mushroom", True, 
                                  f"Retrieved mushroom: {mushroom['common_name']} ({mushroom['latin_name']})")
                    return mushroom
                else:
                    self.log_result("Get Specific Mushroom", False, "ID mismatch in response")
                    return None
            elif response.status_code == 404:
                self.log_result("Get Specific Mushroom", False, "Mushroom not found (404)")
                return None
            else:
                self.log_result("Get Specific Mushroom", False, f"HTTP {response.status_code}", response)
                return None
        except Exception as e:
            self.log_result("Get Specific Mushroom", False, f"Request error: {str(e)}")
            return None

    def test_put_mushroom_success(self, mushroom_id):
        """Test: PUT /api/mushrooms/{id} - Update mushroom successfully"""
        if not mushroom_id:
            self.log_result("PUT Mushroom - Success", False, "No mushroom ID provided")
            return None
            
        # Get original mushroom data first
        try:
            get_response = requests.get(f"{BASE_URL}/mushrooms/{mushroom_id}", timeout=10)
            if get_response.status_code != 200:
                self.log_result("PUT Mushroom - Success", False, "Could not retrieve original mushroom data")
                return None
            
            original_data = get_response.json()
            
            # Prepare modified data
            modified_data = {
                "common_name": "Cèpe de Bordeaux Modifié",
                "latin_name": "Boletus edulis var. modified",
                "edibility": "comestible",
                "season": "Été-Automne-Hiver",
                "description": "Description modifiée - Le cèpe de Bordeaux est un champignon très apprécié en cuisine. Son chapeau est brun et son pied est massif et blanc. Nouvelles informations ajoutées.",
                "characteristics": [
                    "Chapeau brun foncé modifié",
                    "Pied blanc et massif",
                    "Chair blanche et ferme",
                    "Tubes blancs puis jaune-vert",
                    "Nouvelle caractéristique ajoutée"
                ],
                "habitat": "Forêts de feuillus et de conifères, particulièrement sous les chênes et hêtres",
                "lookalikes": [
                    {
                        "name": "Bolet amer",
                        "latin_name": "Tylopilus felleus",
                        "difference": "Chair très amère, pores roses à maturité",
                        "danger_level": "non_comestible"
                    },
                    {
                        "name": "Nouveau sosie ajouté",
                        "latin_name": "Boletus pseudoedulis",
                        "difference": "Chapeau plus clair, chair jaunissante",
                        "danger_level": "non_comestible"
                    }
                ],
                "photo_urls": [
                    "https://example.com/cepe_modified1.jpg",
                    "https://example.com/cepe_modified2.jpg"
                ],
                "photos_base64": [
                    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNkYGBgYGBgYAAAAAUAAY27m/MAAAAASUVORK5CYII="
                ]
            }
            
            # Execute PUT request
            response = requests.put(
                f"{BASE_URL}/mushrooms/{mushroom_id}",
                json=modified_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                updated_mushroom = response.json()
                
                # Verify ID is preserved
                id_preserved = updated_mushroom.get("id") == mushroom_id
                
                # Verify modifications were applied
                name_updated = updated_mushroom.get("common_name") == "Cèpe de Bordeaux Modifié"
                description_updated = "Description modifiée" in updated_mushroom.get("description", "")
                characteristics_count = len(updated_mushroom.get("characteristics", []))
                lookalikes_count = len(updated_mushroom.get("lookalikes", []))
                photos_count = len(updated_mushroom.get("photos_base64", []))
                
                success = all([
                    id_preserved,
                    name_updated,
                    description_updated,
                    characteristics_count == 5,
                    lookalikes_count == 2,
                    photos_count == 2
                ])
                
                details = f"ID preserved: {id_preserved}, Name updated: {name_updated}, " \
                         f"Description updated: {description_updated}, Characteristics: {characteristics_count}/5, " \
                         f"Lookalikes: {lookalikes_count}/2, Photos: {photos_count}/2"
                
                self.log_result("PUT Mushroom - Success", success, details)
                return updated_mushroom if success else None
            else:
                self.log_result("PUT Mushroom - Success", False, f"HTTP {response.status_code}", response)
                return None
                
        except Exception as e:
            self.log_result("PUT Mushroom - Success", False, f"Request error: {str(e)}")
            return None

    def test_put_mushroom_verify_persistence(self, mushroom_id):
        """Test: GET after PUT to verify changes persisted"""
        if not mushroom_id:
            self.log_result("PUT Mushroom - Verify Persistence", False, "No mushroom ID provided")
            return None
            
        try:
            response = requests.get(f"{BASE_URL}/mushrooms/{mushroom_id}", timeout=10)
            
            if response.status_code == 200:
                mushroom = response.json()
                
                # Verify modifications persisted
                name_persisted = mushroom.get("common_name") == "Cèpe de Bordeaux Modifié"
                description_persisted = "Description modifiée" in mushroom.get("description", "")
                characteristics_persisted = len(mushroom.get("characteristics", [])) == 5
                lookalikes_persisted = len(mushroom.get("lookalikes", [])) == 2
                photos_persisted = len(mushroom.get("photos_base64", [])) == 2
                
                success = all([
                    name_persisted,
                    description_persisted,
                    characteristics_persisted,
                    lookalikes_persisted,
                    photos_persisted
                ])
                
                details = f"Name: {name_persisted}, Description: {description_persisted}, " \
                         f"Characteristics: {characteristics_persisted}, Lookalikes: {lookalikes_persisted}, " \
                         f"Photos: {photos_persisted}"
                
                self.log_result("PUT Mushroom - Verify Persistence", success, details)
                return mushroom if success else None
            else:
                self.log_result("PUT Mushroom - Verify Persistence", False, f"HTTP {response.status_code}", response)
                return None
                
        except Exception as e:
            self.log_result("PUT Mushroom - Verify Persistence", False, f"Request error: {str(e)}")
            return None

    def test_put_mushroom_nonexistent_id(self):
        """Test: PUT /api/mushrooms/{id} with non-existent ID - should return 404"""
        fake_id = "nonexistent-mushroom-id-12345"
        
        test_data = {
            "common_name": "Test Mushroom",
            "latin_name": "Testus mushroomus",
            "edibility": "comestible",
            "season": "Printemps",
            "description": "Test description",
            "characteristics": ["Test characteristic"],
            "habitat": "Test habitat",
            "lookalikes": [],
            "photo_urls": [],
            "photos_base64": []
        }
        
        try:
            response = requests.put(
                f"{BASE_URL}/mushrooms/{fake_id}",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            success = response.status_code == 404
            details = f"Status: {response.status_code}, Expected: 404"
            if success and response.json():
                details += f", Message: {response.json().get('detail', 'No detail')}"
            
            self.log_result("PUT Mushroom - Non-existent ID (404)", success, details)
            return success
            
        except Exception as e:
            self.log_result("PUT Mushroom - Non-existent ID (404)", False, f"Request error: {str(e)}")
            return False

    def test_put_mushroom_photos_modification(self, mushroom_id):
        """Test: PUT /api/mushrooms/{id} - Specifically test photos_base64 modification"""
        if not mushroom_id:
            self.log_result("PUT Mushroom - Photos Modification", False, "No mushroom ID provided")
            return None
            
        try:
            # Get current mushroom data
            get_response = requests.get(f"{BASE_URL}/mushrooms/{mushroom_id}", timeout=10)
            if get_response.status_code != 200:
                self.log_result("PUT Mushroom - Photos Modification", False, "Could not retrieve mushroom data")
                return None
            
            current_data = get_response.json()
            
            # Modify only photos, keep other data the same
            photo_update_data = {
                "common_name": current_data["common_name"],
                "latin_name": current_data["latin_name"],
                "edibility": current_data["edibility"],
                "season": current_data["season"],
                "description": current_data["description"],
                "characteristics": current_data["characteristics"],
                "habitat": current_data["habitat"],
                "lookalikes": current_data["lookalikes"],
                "photo_urls": ["https://example.com/new_photo1.jpg", "https://example.com/new_photo2.jpg", "https://example.com/new_photo3.jpg"],
                "photos_base64": [
                    "iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAGklEQVR42mNkYGBgYGBgYAAAAAUAAY27m/MAAAAASUVORK5CYII=",
                    "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHklEQVR42mNkYGBgYGBgYGBgYGBgYGBgYGBgYGBgYAAABQABhQKBwAAAAABJRU5ErkJggg==",
                    "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAI0lEQVR42mNkYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYAAABwAHhwKBwAAAAABJRU5ErkJggg=="
                ]
            }
            
            response = requests.put(
                f"{BASE_URL}/mushrooms/{mushroom_id}",
                json=photo_update_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                updated_mushroom = response.json()
                
                photos_count_correct = len(updated_mushroom.get("photos_base64", [])) == 3
                urls_count_correct = len(updated_mushroom.get("photo_urls", [])) == 3
                photos_match = updated_mushroom.get("photos_base64") == photo_update_data["photos_base64"]
                other_data_preserved = (
                    updated_mushroom.get("common_name") == current_data["common_name"] and
                    updated_mushroom.get("description") == current_data["description"]
                )
                
                success = all([photos_count_correct, urls_count_correct, photos_match, other_data_preserved])
                
                details = f"Photos count: {len(updated_mushroom.get('photos_base64', []))}/3, " \
                         f"URLs count: {len(updated_mushroom.get('photo_urls', []))}/3, " \
                         f"Photos match: {photos_match}, Other data preserved: {other_data_preserved}"
                
                self.log_result("PUT Mushroom - Photos Modification", success, details)
                return updated_mushroom if success else None
            else:
                self.log_result("PUT Mushroom - Photos Modification", False, f"HTTP {response.status_code}", response)
                return None
                
        except Exception as e:
            self.log_result("PUT Mushroom - Photos Modification", False, f"Request error: {str(e)}")
            return None

    def test_mushroom_error_handling(self):
        """Test: Error handling for mushroom database endpoints"""
        fake_id = "non-existent-mushroom-id-12345"
        
        try:
            response = requests.get(f"{BASE_URL}/mushrooms/{fake_id}", timeout=10)
            if response.status_code == 404:
                self.log_result("Mushroom Error Handling - GET Non-existent", True, 
                              "Correctly returned 404 for non-existent mushroom")
            else:
                self.log_result("Mushroom Error Handling - GET Non-existent", False, 
                              f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("Mushroom Error Handling - GET Non-existent", False, f"Request error: {str(e)}")

    def run_mushroom_database_tests(self):
        """Run all mushroom database tests"""
        print("\n" + "=" * 60)
        print("MUSHROOM DATABASE API TESTS")
        print("=" * 60)
        
        # Test 1: Get all mushrooms (initial state)
        initial_mushrooms = self.test_get_all_mushrooms()
        
        # Test 2: Search functionality (should work even if empty)
        self.test_search_mushrooms("cepe")
        
        # Test 3: Create new mushroom
        created_id = self.test_create_mushroom()
        
        # Test 4: Get specific mushroom (if created successfully)
        if created_id:
            self.test_get_specific_mushroom(created_id)
            
            # Test 5: Search for created mushroom by common name
            search_results = self.test_search_mushrooms("Cèpe")
            if search_results:
                found = any(m["common_name"] == "Cèpe de Bordeaux" for m in search_results)
                if found:
                    self.log_result("Search Created Mushroom - Common Name", True, 
                                  "Found created mushroom in search results")
                else:
                    self.log_result("Search Created Mushroom - Common Name", False, 
                                  "Created mushroom not found in search results")
            
            # Test 6: Search for created mushroom by latin name
            search_results = self.test_search_mushrooms("Boletus")
            if search_results:
                found = any(m["latin_name"] == "Boletus edulis" for m in search_results)
                if found:
                    self.log_result("Search Created Mushroom - Latin Name", True, 
                                  "Found created mushroom by latin name search")
                else:
                    self.log_result("Search Created Mushroom - Latin Name", False, 
                                  "Created mushroom not found by latin name search")
        
        # Test 7: Verify data persistence
        final_mushrooms = self.test_get_all_mushrooms()
        if initial_mushrooms is not None and final_mushrooms is not None:
            if len(final_mushrooms) > len(initial_mushrooms):
                self.log_result("Data Persistence Verification", True, 
                              f"Mushroom count increased from {len(initial_mushrooms)} to {len(final_mushrooms)}")
            elif created_id and any(m["id"] == created_id for m in final_mushrooms):
                self.log_result("Data Persistence Verification", True, 
                              "Created mushroom found in final database query")
            else:
                self.log_result("Data Persistence Verification", False, 
                              "Created mushroom not persisted in database")
        
        # Test 8: Error handling
        self.test_mushroom_error_handling()

    def run_put_mushroom_tests(self):
        """Run PUT endpoint tests for mushrooms as requested"""
        print("\n" + "=" * 60)
        print("PUT /api/mushrooms/{id} ENDPOINT TESTS")
        print("=" * 60)
        
        # First, ensure we have a mushroom to test with
        mushrooms = self.test_get_all_mushrooms()
        test_mushroom_id = None
        
        if mushrooms and len(mushrooms) > 0:
            test_mushroom_id = mushrooms[0]["id"]
            self.log_result("GET Initial Mushroom for PUT Testing", True, 
                          f"Using existing mushroom ID: {test_mushroom_id}, Name: {mushrooms[0]['common_name']}")
        else:
            # Create a mushroom for testing if none exist
            test_mushroom_id = self.test_create_mushroom()
            if test_mushroom_id:
                self.log_result("Create Mushroom for PUT Testing", True, 
                              f"Created test mushroom ID: {test_mushroom_id}")
        
        if test_mushroom_id:
            # Test PUT success - modify mushroom
            updated_mushroom = self.test_put_mushroom_success(test_mushroom_id)
            
            # Test GET after modification - verify persistence
            if updated_mushroom:
                self.test_put_mushroom_verify_persistence(test_mushroom_id)
            
            # Test PUT photos modification
            self.test_put_mushroom_photos_modification(test_mushroom_id)
        
        # Test PUT with non-existent ID - should return 404
        self.test_put_mushroom_nonexistent_id()

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

        # NEW: Run mushroom database tests first (as requested in review)
        self.run_mushroom_database_tests()
        
        # NEW: Run PUT endpoint tests specifically (as requested in review)
        self.run_put_mushroom_tests()

        # Test 2-3: Create multiple mushroom spots and verify creation
        print("\n" + "=" * 60)
        print("MUSHROOM SPOTS API TESTS")
        print("=" * 60)
        
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