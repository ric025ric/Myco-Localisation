#!/usr/bin/env python3
"""
Comprehensive test suite for the deployed Render backend
Testing URL: https://myco-localisation-backend.onrender.com
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://myco-localisation-backend.onrender.com"
TIMEOUT = 30  # seconds

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"{'='*60}")

def print_result(success, message, response=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if response:
        print(f"Status Code: {response.status_code}")
        if hasattr(response, 'text'):
            try:
                json_data = response.json()
                print(f"Response: {json.dumps(json_data, indent=2)}")
            except:
                print(f"Response Text: {response.text[:500]}")
    print("-" * 60)

def test_root_endpoint():
    """Test GET /api/ - Root endpoint"""
    print_test_header("Root Endpoint Test")
    
    try:
        response = requests.get(f"{BASE_URL}/api/", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Mushroom Finder API":
                print_result(True, "Root endpoint working correctly", response)
                return True
            else:
                print_result(False, f"Unexpected response message: {data}", response)
                return False
        else:
            print_result(False, f"HTTP {response.status_code} error", response)
            return False
            
    except requests.exceptions.Timeout:
        print_result(False, "Request timed out after 30 seconds")
        return False
    except requests.exceptions.ConnectionError:
        print_result(False, "Connection error - service may be down")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error: {str(e)}")
        return False

def test_get_mushroom_spots_empty():
    """Test GET /api/mushroom-spots - Initial state"""
    print_test_header("Get Mushroom Spots (Initial)")
    
    try:
        response = requests.get(f"{BASE_URL}/api/mushroom-spots", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Successfully retrieved {len(data)} mushroom spots", response)
            return True, data
        else:
            print_result(False, f"HTTP {response.status_code} error", response)
            return False, None
            
    except requests.exceptions.Timeout:
        print_result(False, "Request timed out after 30 seconds")
        return False, None
    except requests.exceptions.ConnectionError:
        print_result(False, "Connection error - service may be down")
        return False, None
    except Exception as e:
        print_result(False, f"Unexpected error: {str(e)}")
        return False, None

def test_create_mushroom_spot():
    """Test POST /api/mushroom-spots - Create new spot"""
    print_test_header("Create Mushroom Spot")
    
    test_spot = {
        "latitude": 48.8566,
        "longitude": 2.3522,
        "mushroom_type": "Cèpe de Bordeaux",
        "notes": "Test depuis Render - déploiement réussi !",
        "photo_base64": None
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/mushroom-spots", 
            json=test_spot,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            if all(key in data for key in ["id", "latitude", "longitude", "mushroom_type"]):
                print_result(True, "Successfully created mushroom spot", response)
                return True, data
            else:
                print_result(False, "Response missing required fields", response)
                return False, None
        else:
            print_result(False, f"HTTP {response.status_code} error", response)
            return False, None
            
    except requests.exceptions.Timeout:
        print_result(False, "Request timed out after 30 seconds")
        return False, None
    except requests.exceptions.ConnectionError:
        print_result(False, "Connection error - service may be down")
        return False, None
    except Exception as e:
        print_result(False, f"Unexpected error: {str(e)}")
        return False, None

def test_get_mushroom_spots_after_creation():
    """Test GET /api/mushroom-spots - After creation"""
    print_test_header("Get Mushroom Spots (After Creation)")
    
    try:
        response = requests.get(f"{BASE_URL}/api/mushroom-spots", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Successfully retrieved {len(data)} mushroom spots", response)
            return True, data
        else:
            print_result(False, f"HTTP {response.status_code} error", response)
            return False, None
            
    except requests.exceptions.Timeout:
        print_result(False, "Request timed out after 30 seconds")
        return False, None
    except requests.exceptions.ConnectionError:
        print_result(False, "Connection error - service may be down")
        return False, None
    except Exception as e:
        print_result(False, f"Unexpected error: {str(e)}")
        return False, None

def test_get_specific_mushroom_spot(spot_id):
    """Test GET /api/mushroom-spots/{spot_id} - Get specific spot"""
    print_test_header(f"Get Specific Mushroom Spot (ID: {spot_id})")
    
    try:
        response = requests.get(f"{BASE_URL}/api/mushroom-spots/{spot_id}", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("id") == spot_id:
                print_result(True, "Successfully retrieved specific mushroom spot", response)
                return True
            else:
                print_result(False, f"ID mismatch: expected {spot_id}, got {data.get('id')}", response)
                return False
        elif response.status_code == 404:
            print_result(False, "Mushroom spot not found", response)
            return False
        else:
            print_result(False, f"HTTP {response.status_code} error", response)
            return False
            
    except requests.exceptions.Timeout:
        print_result(False, "Request timed out after 30 seconds")
        return False
    except requests.exceptions.ConnectionError:
        print_result(False, "Connection error - service may be down")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error: {str(e)}")
        return False

def test_cors_headers():
    """Test CORS headers"""
    print_test_header("CORS Headers Test")
    
    try:
        response = requests.options(f"{BASE_URL}/api/", timeout=TIMEOUT)
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        if any(cors_headers.values()):
            print_result(True, f"CORS headers present: {cors_headers}")
            return True
        else:
            print_result(False, "No CORS headers found")
            return False
            
    except Exception as e:
        print_result(False, f"CORS test failed: {str(e)}")
        return False

def run_comprehensive_test():
    """Run all tests in sequence"""
    print(f"\n🍄 MUSHROOM FINDER API - RENDER DEPLOYMENT TEST")
    print(f"Testing URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"{'='*80}")
    
    results = {
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0,
        "test_details": []
    }
    
    # Test 1: Root endpoint
    results["total_tests"] += 1
    if test_root_endpoint():
        results["passed_tests"] += 1
        results["test_details"].append("✅ Root endpoint (/api/)")
    else:
        results["failed_tests"] += 1
        results["test_details"].append("❌ Root endpoint (/api/)")
    
    # Test 2: Get initial mushroom spots
    results["total_tests"] += 1
    success, initial_spots = test_get_mushroom_spots_empty()
    if success:
        results["passed_tests"] += 1
        results["test_details"].append("✅ Get mushroom spots (initial)")
    else:
        results["failed_tests"] += 1
        results["test_details"].append("❌ Get mushroom spots (initial)")
    
    # Test 3: Create mushroom spot
    results["total_tests"] += 1
    success, created_spot = test_create_mushroom_spot()
    if success:
        results["passed_tests"] += 1
        results["test_details"].append("✅ Create mushroom spot")
    else:
        results["failed_tests"] += 1
        results["test_details"].append("❌ Create mushroom spot")
    
    # Test 4: Get mushroom spots after creation
    results["total_tests"] += 1
    success, updated_spots = test_get_mushroom_spots_after_creation()
    if success:
        results["passed_tests"] += 1
        results["test_details"].append("✅ Get mushroom spots (after creation)")
    else:
        results["failed_tests"] += 1
        results["test_details"].append("❌ Get mushroom spots (after creation)")
    
    # Test 5: Get specific mushroom spot (if we created one)
    if created_spot and created_spot.get("id"):
        results["total_tests"] += 1
        if test_get_specific_mushroom_spot(created_spot["id"]):
            results["passed_tests"] += 1
            results["test_details"].append("✅ Get specific mushroom spot")
        else:
            results["failed_tests"] += 1
            results["test_details"].append("❌ Get specific mushroom spot")
    
    # Test 6: CORS headers
    results["total_tests"] += 1
    if test_cors_headers():
        results["passed_tests"] += 1
        results["test_details"].append("✅ CORS headers")
    else:
        results["failed_tests"] += 1
        results["test_details"].append("❌ CORS headers")
    
    # Print final results
    print(f"\n{'='*80}")
    print(f"🍄 FINAL TEST RESULTS")
    print(f"{'='*80}")
    print(f"Total Tests: {results['total_tests']}")
    print(f"Passed: {results['passed_tests']}")
    print(f"Failed: {results['failed_tests']}")
    print(f"Success Rate: {(results['passed_tests']/results['total_tests']*100):.1f}%")
    print(f"\nDetailed Results:")
    for detail in results["test_details"]:
        print(f"  {detail}")
    
    if results["failed_tests"] == 0:
        print(f"\n🎉 ALL TESTS PASSED! Render deployment is working correctly.")
    else:
        print(f"\n⚠️  {results['failed_tests']} test(s) failed. See details above.")
    
    return results

if __name__ == "__main__":
    run_comprehensive_test()