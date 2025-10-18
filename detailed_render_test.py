#!/usr/bin/env python3
"""
Detailed diagnostic test for Render backend deployment
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "https://myco-localisation-backend.onrender.com"
TIMEOUT = 30

def detailed_test():
    print(f"🍄 DETAILED RENDER BACKEND DIAGNOSTIC")
    print(f"Testing URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 80)
    
    # Test 1: Root endpoint
    print("\n1. Testing Root Endpoint (GET /api/)")
    try:
        response = requests.get(f"{BASE_URL}/api/", timeout=TIMEOUT)
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Get mushroom spots
    print("\n2. Testing Get Mushroom Spots (GET /api/mushroom-spots)")
    try:
        response = requests.get(f"{BASE_URL}/api/mushroom-spots", timeout=TIMEOUT)
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Create mushroom spot
    print("\n3. Testing Create Mushroom Spot (POST /api/mushroom-spots)")
    test_data = {
        "latitude": 48.8566,
        "longitude": 2.3522,
        "mushroom_type": "Cèpe de Bordeaux",
        "notes": "Test depuis Render - déploiement réussi !",
        "photo_base64": None
    }
    try:
        response = requests.post(
            f"{BASE_URL}/api/mushroom-spots",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                spot_id = data.get("id")
                if spot_id:
                    print(f"\n4. Testing Get Specific Spot (GET /api/mushroom-spots/{spot_id})")
                    response = requests.get(f"{BASE_URL}/api/mushroom-spots/{spot_id}", timeout=TIMEOUT)
                    print(f"   Status: {response.status_code}")
                    print(f"   Response: {response.text}")
            except Exception as e:
                print(f"   Error parsing response: {e}")
                
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 4: Check service health
    print("\n5. Service Health Check")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
        print(f"   Root URL Status: {response.status_code}")
        print(f"   Root URL Response: {response.text}")
    except Exception as e:
        print(f"   Root URL Error: {e}")

if __name__ == "__main__":
    detailed_test()