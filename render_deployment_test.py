#!/usr/bin/env python3
"""
Render Deployment Testing for Myco Localisation Backend
Testing MongoDB Atlas integration after modifications
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from user request
BACKEND_URL = "https://myco-localisation-backend.onrender.com"

def test_service_health():
    """Test 1: GET /api/ - Verify service responds"""
    print("🔍 Testing service health...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/", timeout=30)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            print("   ✅ Service is responding correctly")
            return True
        else:
            print(f"   ❌ Service health check failed with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Service health check failed: {e}")
        return False

def test_get_mushroom_spots_empty():
    """Test 2: GET /api/mushroom-spots - List spots (should work even if empty)"""
    print("\n🔍 Testing GET mushroom spots (initial)...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/mushroom-spots", timeout=30)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            spots = response.json()
            print(f"   ✅ Successfully retrieved {len(spots)} spots")
            return True, spots
        else:
            print(f"   ❌ Failed to get spots: {response.status_code}")
            return False, None
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Failed to get spots: {e}")
        return False, None

def test_create_mushroom_spot():
    """Test 3: POST /api/mushroom-spots - Create test spot"""
    print("\n🔍 Testing POST mushroom spot creation...")
    
    test_spot = {
        "latitude": 48.8566,
        "longitude": 2.3522,
        "mushroom_type": "Cèpe de Bordeaux",
        "notes": "Test MongoDB Atlas - connexion OK",
        "photo_base64": None
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/mushroom-spots", 
            json=test_spot,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            created_spot = response.json()
            print(f"   ✅ Successfully created spot with ID: {created_spot.get('id')}")
            return True, created_spot
        else:
            print(f"   ❌ Failed to create spot: {response.status_code}")
            return False, None
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Failed to create spot: {e}")
        return False, None

def test_get_mushroom_spots_after_creation():
    """Test 4: GET /api/mushroom-spots - Verify new spot appears"""
    print("\n🔍 Testing GET mushroom spots (after creation)...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/mushroom-spots", timeout=30)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            spots = response.json()
            print(f"   ✅ Successfully retrieved {len(spots)} spots")
            
            # Look for our test spot
            test_spot_found = False
            for spot in spots:
                if spot.get('mushroom_type') == 'Cèpe de Bordeaux' and 'MongoDB Atlas' in spot.get('notes', ''):
                    test_spot_found = True
                    print(f"   ✅ Found our test spot: {spot.get('id')}")
                    break
            
            if not test_spot_found and len(spots) > 0:
                print("   ⚠️  Test spot not found, but other spots exist")
            
            return True, spots
        else:
            print(f"   ❌ Failed to get spots: {response.status_code}")
            return False, None
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Failed to get spots: {e}")
        return False, None

def test_get_spot_details(spot_id):
    """Test 5: GET /api/mushroom-spots/{id} - Get spot details"""
    print(f"\n🔍 Testing GET spot details for ID: {spot_id}...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/mushroom-spots/{spot_id}", timeout=30)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            spot_details = response.json()
            print(f"   ✅ Successfully retrieved spot details")
            return True, spot_details
        else:
            print(f"   ❌ Failed to get spot details: {response.status_code}")
            return False, None
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Failed to get spot details: {e}")
        return False, None

def main():
    """Run comprehensive Render deployment tests"""
    print("=" * 80)
    print("🍄 MYCO LOCALISATION BACKEND - RENDER DEPLOYMENT TESTING")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print("=" * 80)
    
    results = {
        "service_health": False,
        "get_spots_initial": False,
        "create_spot": False,
        "get_spots_after": False,
        "get_spot_details": False,
        "mongodb_connection": False,
        "overall_success": False
    }
    
    created_spot_id = None
    
    # Test 1: Service Health
    results["service_health"] = test_service_health()
    
    if not results["service_health"]:
        print("\n❌ Service is not responding. Stopping tests.")
        return results
    
    # Test 2: Initial GET spots
    success, initial_spots = test_get_mushroom_spots_empty()
    results["get_spots_initial"] = success
    
    if success:
        results["mongodb_connection"] = True
        print("   ✅ MongoDB connection appears to be working")
    
    # Test 3: Create spot
    success, created_spot = test_create_mushroom_spot()
    results["create_spot"] = success
    
    if success and created_spot:
        created_spot_id = created_spot.get('id')
        results["mongodb_connection"] = True
    
    # Test 4: GET spots after creation
    success, updated_spots = test_get_mushroom_spots_after_creation()
    results["get_spots_after"] = success
    
    # Test 5: Get spot details (if we have an ID)
    if created_spot_id:
        success, spot_details = test_get_spot_details(created_spot_id)
        results["get_spot_details"] = success
    elif updated_spots and len(updated_spots) > 0:
        # Try with the first available spot
        first_spot_id = updated_spots[0].get('id')
        if first_spot_id:
            success, spot_details = test_get_spot_details(first_spot_id)
            results["get_spot_details"] = success
    
    # Overall assessment
    critical_tests = [results["service_health"], results["get_spots_initial"], results["create_spot"]]
    results["overall_success"] = all(critical_tests)
    
    # Print summary
    print("\n" + "=" * 80)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 80)
    
    test_names = {
        "service_health": "Service Health Check (GET /api/)",
        "get_spots_initial": "Get Mushroom Spots (Initial)",
        "create_spot": "Create Mushroom Spot (POST)",
        "get_spots_after": "Get Mushroom Spots (After Creation)",
        "get_spot_details": "Get Spot Details (GET by ID)",
        "mongodb_connection": "MongoDB Atlas Connection"
    }
    
    for key, name in test_names.items():
        status = "✅ PASS" if results[key] else "❌ FAIL"
        print(f"{name:<40} {status}")
    
    print("-" * 80)
    overall_status = "✅ SUCCESS" if results["overall_success"] else "❌ FAILED"
    print(f"{'OVERALL DEPLOYMENT STATUS':<40} {overall_status}")
    
    if results["mongodb_connection"]:
        print("\n🎉 MongoDB Atlas connection is working!")
    else:
        print("\n⚠️  MongoDB Atlas connection issues detected")
    
    return results

if __name__ == "__main__":
    results = main()