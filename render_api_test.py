#!/usr/bin/env python3
"""
Myco Localisation Backend API Testing for Render Deployment
Specifically tests the endpoints requested in the review
"""

import requests
import json
import time
from datetime import datetime

# Configuration from review request
BASE_URL = "https://myco-localisation-backend.onrender.com"
API_BASE = f"{BASE_URL}/api"

def wait_for_service_startup(max_wait_minutes=3):
    """Wait for Render service to start up from cold state"""
    print("🔍 Checking if Render service is available...")
    
    max_attempts = max_wait_minutes * 4  # Check every 15 seconds
    
    for attempt in range(max_attempts):
        try:
            print(f"   Attempt {attempt + 1}/{max_attempts}...")
            response = requests.get(BASE_URL, timeout=15)
            
            if response.status_code == 502:
                print("   ⏰ Service starting up (502 Bad Gateway)...")
                if attempt < max_attempts - 1:
                    print("   Waiting 15 seconds...")
                    time.sleep(15)
                continue
            elif response.status_code in [200, 404]:
                print("   ✅ Service is responding!")
                return True
            else:
                print(f"   ⚠️ Unexpected status: {response.status_code}")
                return True  # Still try the API tests
                
        except requests.exceptions.Timeout:
            print("   ⏰ Request timed out...")
            if attempt < max_attempts - 1:
                print("   Waiting 15 seconds...")
                time.sleep(15)
        except requests.exceptions.ConnectionError:
            print("   🔌 Connection error...")
            if attempt < max_attempts - 1:
                print("   Waiting 15 seconds...")
                time.sleep(15)
        except Exception as e:
            print(f"   ❌ Error: {e}")
            if attempt < max_attempts - 1:
                time.sleep(15)
    
    print("   ❌ Service did not start within the timeout period")
    return False

def test_root_endpoint():
    """Test GET /api/ - Should return {"message": "Mushroom Finder API"}"""
    print("\n🧪 Testing GET /api/ (Root endpoint)")
    try:
        response = requests.get(f"{API_BASE}/", timeout=30)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("message") == "Mushroom Finder API":
                    print("   ✅ Root endpoint test PASSED")
                    return True
                else:
                    print(f"   ❌ Unexpected message: {data}")
                    return False
            except json.JSONDecodeError:
                print("   ❌ Response is not valid JSON")
                return False
        else:
            print(f"   ❌ Root endpoint test FAILED")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_get_mushroom_spots():
    """Test GET /api/mushroom-spots - List all spots"""
    print("\n🧪 Testing GET /api/mushroom-spots")
    try:
        response = requests.get(f"{API_BASE}/mushroom-spots", timeout=30)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   Response: Found {len(data)} mushroom spots")
                if isinstance(data, list):
                    print("   ✅ GET mushroom spots test PASSED")
                    return True, data
                else:
                    print("   ❌ Response is not a list")
                    return False, None
            except json.JSONDecodeError:
                print("   ❌ Response is not valid JSON")
                return False, None
        else:
            print(f"   Response: {response.text}")
            print("   ❌ GET mushroom spots test FAILED")
            return False, None
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False, None

def test_create_mushroom_spot():
    """Test POST /api/mushroom-spots with exact data from review request"""
    print("\n🧪 Testing POST /api/mushroom-spots")
    
    # Exact test data from review request
    test_data = {
        "latitude": 48.8566,
        "longitude": 2.3522,
        "mushroom_type": "Test Champignon",
        "notes": "Test depuis Render",
        "photo_base64": None
    }
    
    print(f"   Sending data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(
            f"{API_BASE}/mushroom-spots",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                # Check if required fields are present
                required_fields = ["id", "latitude", "longitude", "mushroom_type", "notes", "timestamp"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Verify the data matches what we sent
                    if (data["latitude"] == test_data["latitude"] and 
                        data["longitude"] == test_data["longitude"] and
                        data["mushroom_type"] == test_data["mushroom_type"] and
                        data["notes"] == test_data["notes"]):
                        print("   ✅ POST mushroom spot test PASSED")
                        return True, data
                    else:
                        print("   ❌ Response data doesn't match input data")
                        return False, None
                else:
                    print(f"   ❌ Missing required fields: {missing_fields}")
                    return False, None
            except json.JSONDecodeError:
                print("   ❌ Response is not valid JSON")
                return False, None
        else:
            print("   ❌ POST mushroom spot test FAILED")
            return False, None
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False, None

def test_cors_headers():
    """Test CORS configuration"""
    print("\n🧪 Testing CORS Headers")
    try:
        # Test with OPTIONS request
        response = requests.options(f"{API_BASE}/mushroom-spots", timeout=30)
        print(f"   OPTIONS Status Code: {response.status_code}")
        
        # Check CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        print(f"   CORS Headers:")
        for header, value in cors_headers.items():
            print(f"     {header}: {value}")
        
        if cors_headers['Access-Control-Allow-Origin']:
            print("   ✅ CORS headers are configured")
            return True
        else:
            print("   ⚠️ CORS headers might be missing")
            return False
            
    except Exception as e:
        print(f"   ❌ CORS test error: {e}")
        return False

def test_mongodb_connection():
    """Test if MongoDB connection is working by checking if we can create and retrieve data"""
    print("\n🧪 Testing MongoDB Connection")
    
    # First try to get existing spots
    get_success, existing_spots = test_get_mushroom_spots()
    if not get_success:
        print("   ❌ Cannot retrieve data - MongoDB connection issue")
        return False
    
    # Try to create a spot
    create_success, created_spot = test_create_mushroom_spot()
    if not create_success:
        print("   ❌ Cannot create data - MongoDB connection issue")
        return False
    
    print("   ✅ MongoDB connection is working")
    return True

def main():
    """Run all tests as specified in the review request"""
    print("=" * 70)
    print("🍄 MYCO LOCALISATION BACKEND API TESTING")
    print("=" * 70)
    print(f"🌐 Backend URL: {BASE_URL}")
    print(f"📅 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Step 1: Wait for service to be available
    if not wait_for_service_startup():
        print("\n❌ CRITICAL: Render service is not responding")
        print("   This could mean:")
        print("   - Service is still starting up (can take 1-2 minutes)")
        print("   - Service deployment failed")
        print("   - Service is experiencing issues")
        return False
    
    # Step 2: Run the specific tests requested
    results = []
    
    # Test 1: GET /api/
    results.append(test_root_endpoint())
    
    # Test 2: GET /api/mushroom-spots
    get_success, spots_data = test_get_mushroom_spots()
    results.append(get_success)
    
    # Test 3: POST /api/mushroom-spots
    post_success, created_spot = test_create_mushroom_spot()
    results.append(post_success)
    
    # Additional tests
    results.append(test_cors_headers())
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 70)
    
    test_names = [
        "GET /api/ (Root endpoint)",
        "GET /api/mushroom-spots (List spots)",
        "POST /api/mushroom-spots (Create spot)",
        "CORS Configuration"
    ]
    
    passed = 0
    for i, (test_name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {i+1}. {test_name}: {status}")
        if result:
            passed += 1
    
    total = len(results)
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    # Specific findings
    print("\n📋 DETAILED FINDINGS:")
    
    if results[0]:  # Root endpoint
        print("   ✅ Backend is accessible and responding")
    else:
        print("   ❌ Backend root endpoint not working")
    
    if results[1]:  # GET spots
        print("   ✅ Can retrieve mushroom spots from database")
    else:
        print("   ❌ Cannot retrieve mushroom spots - possible MongoDB issue")
    
    if results[2]:  # POST spots
        print("   ✅ Can create new mushroom spots")
    else:
        print("   ❌ Cannot create mushroom spots - possible MongoDB issue")
    
    if results[3]:  # CORS
        print("   ✅ CORS headers are configured")
    else:
        print("   ⚠️ CORS configuration might need attention")
    
    # MongoDB assessment
    if results[1] and results[2]:
        print("   ✅ MongoDB connection is working properly")
    elif not results[1] and not results[2]:
        print("   ❌ MongoDB connection appears to be broken")
    else:
        print("   ⚠️ MongoDB connection has partial issues")
    
    print("\n" + "=" * 70)
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - Render deployment is fully functional!")
        return True
    elif passed >= 2:
        print("⚠️ PARTIAL SUCCESS - Core functionality working, some issues detected")
        return True
    else:
        print("❌ CRITICAL ISSUES - Render deployment has major problems")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)