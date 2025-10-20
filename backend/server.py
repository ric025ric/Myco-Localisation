from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Mushroom Spot Models
class MushroomSpot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    latitude: float
    longitude: float
    mushroom_type: str
    notes: str = ""
    photo_base64: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = "Utilisateur"  # Default if not provided

class MushroomSpotCreate(BaseModel):
    latitude: float
    longitude: float
    mushroom_type: str
    notes: str = ""
    photo_base64: Optional[str] = None

class MushroomSpotUpdate(BaseModel):
    mushroom_type: Optional[str] = None
    notes: Optional[str] = None
    photo_base64: Optional[str] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Mushroom Finder API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Mushroom Spot Endpoints
@api_router.post("/mushroom-spots", response_model=MushroomSpot)
async def create_mushroom_spot(mushroom_spot: MushroomSpotCreate):
    """Create a new mushroom spot"""
    try:
        spot_dict = mushroom_spot.dict()
        spot_obj = MushroomSpot(**spot_dict)
        result = await db.mushroom_spots.insert_one(spot_obj.dict())
        return spot_obj
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/mushroom-spots", response_model=List[MushroomSpot])
async def get_mushroom_spots():
    """Get all mushroom spots"""
    try:
        spots = await db.mushroom_spots.find().sort("timestamp", -1).to_list(1000)
        return [MushroomSpot(**spot) for spot in spots]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/mushroom-spots/{spot_id}", response_model=MushroomSpot)
async def get_mushroom_spot(spot_id: str):
    """Get a specific mushroom spot by ID"""
    try:
        spot = await db.mushroom_spots.find_one({"id": spot_id})
        if not spot:
            raise HTTPException(status_code=404, detail="Mushroom spot not found")
        return MushroomSpot(**spot)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/mushroom-spots/{spot_id}", response_model=MushroomSpot)
async def update_mushroom_spot(spot_id: str, updates: MushroomSpotUpdate):
    """Update a mushroom spot"""
    try:
        # Get existing spot
        existing_spot = await db.mushroom_spots.find_one({"id": spot_id})
        if not existing_spot:
            raise HTTPException(status_code=404, detail="Mushroom spot not found")
        
        # Apply updates
        update_dict = {k: v for k, v in updates.dict().items() if v is not None}
        if update_dict:
            await db.mushroom_spots.update_one(
                {"id": spot_id}, 
                {"$set": update_dict}
            )
        
        # Return updated spot
        updated_spot = await db.mushroom_spots.find_one({"id": spot_id})
        return MushroomSpot(**updated_spot)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/mushroom-spots/{spot_id}")
async def delete_mushroom_spot(spot_id: str):
    """Delete a mushroom spot"""
    try:
        result = await db.mushroom_spots.delete_one({"id": spot_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Mushroom spot not found")
        return {"message": "Mushroom spot deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/mushroom-spots/nearby/{latitude}/{longitude}")
async def get_nearby_mushroom_spots(latitude: float, longitude: float, radius_km: float = 5.0):
    """Get mushroom spots within a certain radius (in kilometers)"""
    try:
        # Simple distance calculation (for more precision, use geospatial queries)
        # This is a basic implementation - for production, you'd use MongoDB's geospatial features
        all_spots = await db.mushroom_spots.find().to_list(1000)
        nearby_spots = []
        
        for spot_data in all_spots:
            spot = MushroomSpot(**spot_data)
            # Simple distance calculation (Haversine formula would be more accurate)
            lat_diff = abs(spot.latitude - latitude)
            lon_diff = abs(spot.longitude - longitude)
            # Rough approximation: 1 degree ≈ 111 km
            distance_km = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111
            
            if distance_km <= radius_km:
                nearby_spots.append(spot)
        
        return nearby_spots
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()