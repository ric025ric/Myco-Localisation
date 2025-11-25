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

def test_privacy_regression():
    """
    CRITICAL PRIVACY REGRESSION TESTS
    Testing the reported issue where users see spots that aren't theirs
    """
    print("🔒 STARTING CRITICAL PRIVACY REGRESSION TESTS")
    print("=" * 60)
    
    # Test data
    test_user_A = "test_user_A"
    test_user_B = "test_user_B"
    isolation_test_A = "isolation_test_A"
    isolation_test_B = "isolation_test_B"
    
    created_spots = []  # Track created spots for cleanup
    
    try:
        # TEST 1: Verify user_id filtering works correctly
        print("\n🧪 TEST 1: Vérifier que le filtrage par user_id fonctionne")
        print("-" * 50)
        
        # Create 3 spots for test_user_A
        print(f"Creating 3 spots for {test_user_A}...")
        for i in range(3):
            spot_data = {
                "latitude": 45.7640 + i * 0.001,
                "longitude": 4.8357 + i * 0.001,
                "mushroom_type": f"Cèpe de Bordeaux A{i+1}",
                "notes": f"Spot trouvé par {test_user_A} - #{i+1}",
                "user_id": test_user_A
            }
            
            response = requests.post(f"{BACKEND_URL}/mushroom-spots", json=spot_data)
            if response.status_code == 200:
                spot = response.json()
                created_spots.append(spot['id'])
                print(f"  ✅ Created spot A{i+1}: {spot['id']}")
            else:
                print(f"  ❌ Failed to create spot A{i+1}: {response.status_code} - {response.text}")
                return False
        
        # Create 3 spots for test_user_B
        print(f"\nCreating 3 spots for {test_user_B}...")
        for i in range(3):
            spot_data = {
                "latitude": 45.7640 + i * 0.001 + 0.01,
                "longitude": 4.8357 + i * 0.001 + 0.01,
                "mushroom_type": f"Girolle B{i+1}",
                "notes": f"Spot trouvé par {test_user_B} - #{i+1}",
                "user_id": test_user_B
            }
            
            response = requests.post(f"{BACKEND_URL}/mushroom-spots", json=spot_data)
            if response.status_code == 200:
                spot = response.json()
                created_spots.append(spot['id'])
                print(f"  ✅ Created spot B{i+1}: {spot['id']}")
            else:
                print(f"  ❌ Failed to create spot B{i+1}: {response.status_code} - {response.text}")
                return False
        
        # GET spots for test_user_A - should only return 3 spots
        print(f"\n🔍 Testing GET /api/mushroom-spots?user_id={test_user_A}")
        response = requests.get(f"{BACKEND_URL}/mushroom-spots?user_id={test_user_A}")
        
        if response.status_code != 200:
            print(f"❌ GET request failed: {response.status_code} - {response.text}")
            return False
        
        spots_A = response.json()
        print(f"  📊 Retrieved {len(spots_A)} spots for {test_user_A}")
        
        # CRITICAL CHECK: Should have exactly 3 spots
        if len(spots_A) != 3:
            print(f"❌ CRITICAL FAILURE: Expected 3 spots for {test_user_A}, got {len(spots_A)}")
            return False
        
        # CRITICAL CHECK: All spots should belong to test_user_A
        user_b_spots_in_a = []
        for spot in spots_A:
            if spot.get('user_id') != test_user_A:
                user_b_spots_in_a.append(spot)
        
        if user_b_spots_in_a:
            print(f"❌ CRITICAL PRIVACY BREACH: Found {len(user_b_spots_in_a)} spots from other users in {test_user_A}'s results!")
            for spot in user_b_spots_in_a:
                print(f"   🚨 Leaked spot: {spot.get('mushroom_type')} (user_id: {spot.get('user_id')})")
            return False
        
        print(f"  ✅ All {len(spots_A)} spots belong to {test_user_A}")
        
        # Verify spot content
        for spot in spots_A:
            if "Cèpe de Bordeaux A" not in spot['mushroom_type']:
                print(f"❌ Unexpected mushroom type: {spot['mushroom_type']}")
                return False
        
        print("  ✅ All spots have correct mushroom types for user A")
        
        # TEST 2: Security - Without parameter, should return empty list
        print("\n🧪 TEST 2: Sécurité - Sans paramètre, liste vide")
        print("-" * 50)
        
        response = requests.get(f"{BACKEND_URL}/mushroom-spots")
        
        if response.status_code != 200:
            print(f"❌ GET request without parameters failed: {response.status_code} - {response.text}")
            return False
        
        spots_no_param = response.json()
        print(f"  📊 Retrieved {len(spots_no_param)} spots without parameters")
        
        if len(spots_no_param) != 0:
            print(f"❌ CRITICAL SECURITY FAILURE: Expected empty list, got {len(spots_no_param)} spots!")
            print("  🚨 This means users can see all spots without authentication!")
            return False
        
        print("  ✅ Security check passed: Empty list returned without parameters")
        
        # TEST 3: Test user_B isolation
        print(f"\n🧪 TEST 3: Vérifier l'isolation de {test_user_B}")
        print("-" * 50)
        
        response = requests.get(f"{BACKEND_URL}/mushroom-spots?user_id={test_user_B}")
        
        if response.status_code != 200:
            print(f"❌ GET request for {test_user_B} failed: {response.status_code} - {response.text}")
            return False
        
        spots_B = response.json()
        print(f"  📊 Retrieved {len(spots_B)} spots for {test_user_B}")
        
        if len(spots_B) != 3:
            print(f"❌ Expected 3 spots for {test_user_B}, got {len(spots_B)}")
            return False
        
        # Check no cross-contamination
        user_a_spots_in_b = []
        for spot in spots_B:
            if spot.get('user_id') != test_user_B:
                user_a_spots_in_b.append(spot)
        
        if user_a_spots_in_b:
            print(f"❌ CRITICAL PRIVACY BREACH: Found {len(user_a_spots_in_b)} spots from other users in {test_user_B}'s results!")
            return False
        
        print(f"  ✅ All {len(spots_B)} spots belong to {test_user_B}")
        
        # TEST 4: Complete isolation test
        print("\n🧪 TEST 4: Isolation complète des données")
        print("-" * 50)
        
        # Create one spot for isolation_test_A
        spot_data_A = {
            "latitude": 45.7500,
            "longitude": 4.8500,
            "mushroom_type": "Isolation Test Mushroom A",
            "notes": "This spot should ONLY be visible to isolation_test_A",
            "user_id": isolation_test_A
        }
        
        response = requests.post(f"{BACKEND_URL}/mushroom-spots", json=spot_data_A)
        if response.status_code == 200:
            spot_A = response.json()
            created_spots.append(spot_A['id'])
            print(f"  ✅ Created isolation spot A: {spot_A['id']}")
        else:
            print(f"  ❌ Failed to create isolation spot A: {response.status_code}")
            return False
        
        # Create one spot for isolation_test_B
        spot_data_B = {
            "latitude": 45.7600,
            "longitude": 4.8600,
            "mushroom_type": "Isolation Test Mushroom B",
            "notes": "This spot should ONLY be visible to isolation_test_B",
            "user_id": isolation_test_B
        }
        
        response = requests.post(f"{BACKEND_URL}/mushroom-spots", json=spot_data_B)
        if response.status_code == 200:
            spot_B = response.json()
            created_spots.append(spot_B['id'])
            print(f"  ✅ Created isolation spot B: {spot_B['id']}")
        else:
            print(f"  ❌ Failed to create isolation spot B: {response.status_code}")
            return False
        
        # CRITICAL TEST: Get spots for isolation_test_A
        print(f"\n🔍 CRITICAL CHECK: Getting spots for {isolation_test_A}")
        response = requests.get(f"{BACKEND_URL}/mushroom-spots?user_id={isolation_test_A}")
        
        if response.status_code != 200:
            print(f"❌ GET request failed: {response.status_code}")
            return False
        
        spots_isolation_A = response.json()
        print(f"  📊 Retrieved {len(spots_isolation_A)} spots for {isolation_test_A}")
        
        # Should have exactly 1 spot
        if len(spots_isolation_A) != 1:
            print(f"❌ Expected 1 spot for {isolation_test_A}, got {len(spots_isolation_A)}")
            return False
        
        # CRITICAL: Check if isolation_test_B's spot appears
        for spot in spots_isolation_A:
            if spot.get('user_id') == isolation_test_B:
                print(f"❌ CRITICAL PRIVACY BREACH: {isolation_test_B}'s spot found in {isolation_test_A}'s results!")
                print(f"   🚨 Leaked spot: {spot.get('mushroom_type')}")
                return False
            
            if "Isolation Test Mushroom B" in spot.get('mushroom_type', ''):
                print(f"❌ CRITICAL PRIVACY BREACH: {isolation_test_B}'s mushroom found in {isolation_test_A}'s results!")
                return False
        
        print(f"  ✅ PRIVACY VERIFIED: {isolation_test_B}'s spot NOT visible to {isolation_test_A}")
        
        # Verify the correct spot is returned
        if spots_isolation_A[0]['mushroom_type'] != "Isolation Test Mushroom A":
            print(f"❌ Wrong mushroom type: {spots_isolation_A[0]['mushroom_type']}")
            return False
        
        print("  ✅ Correct spot returned for isolation_test_A")
        
        print("\n🎉 ALL PRIVACY REGRESSION TESTS PASSED!")
        print("✅ User data isolation is working correctly")
        print("✅ No privacy breaches detected")
        print("✅ Security measures are effective")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {str(e)}")
        return False
    
    finally:
        # Cleanup created spots
        print(f"\n🧹 Cleaning up {len(created_spots)} test spots...")
        cleanup_count = 0
        for spot_id in created_spots:
            try:
                response = requests.delete(f"{BACKEND_URL}/mushroom-spots/{spot_id}")
                if response.status_code == 200:
                    cleanup_count += 1
                else:
                    print(f"  ⚠️ Failed to delete spot {spot_id}: {response.status_code}")
            except Exception as e:
                print(f"  ⚠️ Error deleting spot {spot_id}: {str(e)}")
        
        print(f"  ✅ Cleaned up {cleanup_count}/{len(created_spots)} spots")

def test_compatibility_with_old_spots():
    """
    TEST 3: Compatibility with old spots (without user_id)
    """
    print("\n🧪 TEST 3: Compatibilité avec anciens spots (sans user_id)")
    print("-" * 50)
    
    try:
        # Check if there are any spots without user_id in the database
        # We'll test this by trying to get spots with created_by parameter
        
        # First, let's see if we can find any existing spots
        response = requests.get(f"{BACKEND_URL}/mushroom-spots?created_by=legacy_user")
        
        if response.status_code != 200:
            print(f"❌ GET request with created_by failed: {response.status_code}")
            return False
        
        legacy_spots = response.json()
        print(f"  📊 Found {len(legacy_spots)} spots with created_by='legacy_user'")
        
        if len(legacy_spots) == 0:
            print("  ℹ️ No legacy spots found - this is expected for new installations")
            print("  ✅ Legacy compatibility endpoint is functional")
        else:
            print("  ✅ Legacy spots can be retrieved via created_by parameter")
        
        return True
        
    except Exception as e:
        print(f"❌ Legacy compatibility test failed: {str(e)}")
        return False

def main():
    """Main test runner"""
    print("🍄 MUSHROOM LOCATOR - PRIVACY REGRESSION TEST SUITE")
    print("=" * 60)
    print("Testing critical privacy issue reported in version 1.8.1")
    print("Issue: Users seeing spots that aren't theirs")
    print("=" * 60)
    
    # Test API health first
    print("\n🏥 Testing API Health...")
    try:
        response = requests.get(f"{BACKEND_URL}/")
        if response.status_code == 200:
            print("  ✅ Backend API is responding")
        else:
            print(f"  ❌ Backend API health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"  ❌ Cannot connect to backend: {str(e)}")
        return
    
    # Run privacy regression tests
    privacy_test_passed = test_privacy_regression()
    
    # Run compatibility tests
    compatibility_test_passed = test_compatibility_with_old_spots()
    
    # Final summary
    print("\n" + "=" * 60)
    print("🏁 FINAL TEST RESULTS")
    print("=" * 60)
    
    if privacy_test_passed and compatibility_test_passed:
        print("🎉 ALL TESTS PASSED - PRIVACY REGRESSION RESOLVED!")
        print("✅ User data isolation is working correctly")
        print("✅ No privacy breaches detected")
        print("✅ Legacy compatibility maintained")
        print("\n🔒 The reported privacy issue has been successfully fixed.")
    else:
        print("❌ TESTS FAILED - PRIVACY REGRESSION STILL EXISTS!")
        if not privacy_test_passed:
            print("❌ Privacy isolation tests failed")
        if not compatibility_test_passed:
            print("❌ Legacy compatibility tests failed")
        print("\n🚨 CRITICAL: The privacy issue is NOT resolved!")

if __name__ == "__main__":
    main()