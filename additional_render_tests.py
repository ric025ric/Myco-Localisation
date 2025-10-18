#!/usr/bin/env python3
"""
Additional Render Deployment Tests
Testing edge cases and error handling
"""

import requests
import json

BACKEND_URL = "https://myco-localisation-backend.onrender.com"

def test_invalid_spot_id():
    """Test GET with invalid spot ID - should return 404"""
    print("🔍 Testing invalid spot ID (404 handling)...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/mushroom-spots/invalid-id-123", timeout=30)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 404:
            print("   ✅ Correctly returns 404 for invalid ID")
            return True
        else:
            print(f"   ❌ Expected 404, got {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error testing invalid ID: {e}")
        return False

def test_invalid_post_data():
    """Test POST with invalid data - should return 400/422"""
    print("\n🔍 Testing invalid POST data (validation)...")
    
    invalid_spot = {
        "latitude": "invalid",  # Should be float
        "longitude": 2.3522,
        "mushroom_type": "Test"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/mushroom-spots", 
            json=invalid_spot,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code in [400, 422]:
            print("   ✅ Correctly validates input data")
            return True
        else:
            print(f"   ❌ Expected 400/422, got {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error testing invalid data: {e}")
        return False

def test_nearby_spots():
    """Test nearby spots endpoint"""
    print("\n🔍 Testing nearby spots endpoint...")
    try:
        # Use Paris coordinates
        response = requests.get(f"{BACKEND_URL}/api/mushroom-spots/nearby/48.8566/2.3522?radius_km=10", timeout=30)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            nearby_spots = response.json()
            print(f"   ✅ Found {len(nearby_spots)} nearby spots")
            return True
        else:
            print(f"   ❌ Failed to get nearby spots: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error testing nearby spots: {e}")
        return False

def main():
    print("=" * 60)
    print("🔍 ADDITIONAL RENDER DEPLOYMENT TESTS")
    print("=" * 60)
    
    results = []
    
    # Test error handling
    results.append(("Invalid Spot ID (404)", test_invalid_spot_id()))
    results.append(("Invalid POST Data (Validation)", test_invalid_post_data()))
    results.append(("Nearby Spots Endpoint", test_nearby_spots()))
    
    print("\n" + "=" * 60)
    print("📊 ADDITIONAL TESTS SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:<35} {status}")
    
    all_passed = all(result[1] for result in results)
    overall_status = "✅ ALL PASSED" if all_passed else "❌ SOME FAILED"
    print("-" * 60)
    print(f"{'ADDITIONAL TESTS STATUS':<35} {overall_status}")
    
    return all_passed

if __name__ == "__main__":
    main()