'''Python
1|from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile
2|from dotenv import load_dotenv
3|from starlette.middleware.cors import CORSMiddleware
4|from motor.motor_asyncio import AsyncIOMotorClient
5|import os
6|import logging
7|from pathlib import Path
8|from pydantic import BaseModel, Field
9|from typing import List, Optional
10|import uuid
11|from datetime import datetime
12|import base64
13|
14|
15|ROOT_DIR = Path(__file__).parent
16|load_dotenv(ROOT_DIR / '.env')
17|
18|# MongoDB connection
19|mongo_url = os.environ['MONGO_URL']
20|client = AsyncIOMotorClient(mongo_url)
21|db = client[os.environ['DB_NAME']]
22|
23|# Create the main app without a prefix
24|app = FastAPI()
25|
26|# Create a router with the /api prefix
27|api_router = APIRouter(prefix="/api")
28|
29|
30|# Define Models
31|class StatusCheck(BaseModel):
32|    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
33|    client_name: str
34|    timestamp: datetime = Field(default_factory=datetime.utcnow)
35|
36|class StatusCheckCreate(BaseModel):
37|    client_name: str
38|
39|# Mushroom Spot Models
40|class MushroomSpot(BaseModel):
41|    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
42|    latitude: float
43|    longitude: float
44|    mushroom_type: str
45|    notes: str = ""
46|    photo_base64: Optional[str] = None
47|    timestamp: datetime = Field(default_factory=datetime.utcnow)
48|    created_by: str = "Utilisateur"  # Default if not provided
49|
50|class MushroomSpotCreate(BaseModel):
51|    latitude: float
52|    longitude: float
53|    mushroom_type: str
54|    notes: str = ""
55|    photo_base64: Optional[str] = None
56|    created_by: str = "Utilisateur"
57|
58|class MushroomSpotUpdate(BaseModel):
59|    mushroom_type: Optional[str] = None
60|    notes: Optional[str] = None
61|    photo_base64: Optional[str] = None
62|
63|# Mushroom Database Models
64|class MushroomLookalike(BaseModel):
65|    name: str
66|    latin_name: str
67|    difference: str
68|    danger_level: str  # "mortel", "toxique", "non_comestible"
69|
70|class MushroomInfo(BaseModel):
71|    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
72|    common_name: str
73|    latin_name: str
74|    edibility: str  # "comestible", "toxique", "mortel", "non_comestible", "comestible_conditionnel"
75|    season: str
76|    description: str
77|    characteristics: List[str]
78|    habitat: str
79|    lookalikes: List[MushroomLookalike] = []
80|    photo_urls: List[str] = []
81|    photos_base64: List[str] = []  # Photos en base64
82|
83|class MushroomInfoCreate(BaseModel):
84|    common_name: str
85|    latin_name: str
86|    edibility: str
87|    season: str
88|    description: str
89|    characteristics: List[str]
90|    habitat: str
91|    lookalikes: List[MushroomLookalike] = []
92|    photo_urls: List[str] = []
93|    photos_base64: List[str] = []  # Photos stockées en base64
94|
95|# Add your routes to the router instead of directly to app
96|@api_router.get("/")
97|async def root():
98|    return {"message": "Mushroom Finder API"}
99|
100|@api_router.post("/status", response_model=StatusCheck)
101|async def create_status_check(input: StatusCheckCreate):
102|    status_dict = input.dict()
103|    status_obj = StatusCheck(**status_dict)
104|    _ = await db.status_checks.insert_one(status_obj.dict())
105|    return status_obj
106|
107|@api_router.get("/status", response_model=List[StatusCheck])
108|async def get_status_checks():
109|    status_checks = await db.status_checks.find().to_list(1000)
110|    return [StatusCheck(**status_check) for status_check in status_checks]
111|
112|# Mushroom Spot Endpoints
113|@api_router.post("/mushroom-spots", response_model=MushroomSpot)
114|async def create_mushroom_spot(mushroom_spot: MushroomSpotCreate):
115|    """Create a new mushroom spot"""
116|    try:
117|        spot_dict = mushroom_spot.dict()
118|        spot_obj = MushroomSpot(**spot_dict)
119|        result = await db.mushroom_spots.insert_one(spot_obj.dict())
120|        return spot_obj
121|    except Exception as e:
122|        raise HTTPException(status_code=400, detail=str(e))
123|
124|@api_router.get("/mushroom-spots", response_model=List[MushroomSpot])
125|async def get_mushroom_spots():
126|    """Get all mushroom spots"""
127|    try:
128|        spots = await db.mushroom_spots.find().sort("timestamp", -1).to_list(1000)
129|        return [MushroomSpot(**spot) for spot in spots]
130|    except Exception as e:
131|        raise HTTPException(status_code=500, detail=str(e))
132|
133|@api_router.get("/mushroom-spots/{spot_id}", response_model=MushroomSpot)
134|async def get_mushroom_spot(spot_id: str):
135|    """Get a specific mushroom spot by ID"""
136|    try:
137|        spot = await db.mushroom_spots.find_one({"id": spot_id})
138|        if not spot:
139|            raise HTTPException(status_code=404, detail="Mushroom spot not found")
140|        return MushroomSpot(**spot)
141|    except HTTPException:
142|        raise
143|    except Exception as e:
144|        raise HTTPException(status_code=500, detail=str(e))
145|
146|@api_router.put("/mushroom-spots/{spot_id}", response_model=MushroomSpot)
147|async def update_mushroom_spot(spot_id: str, updates: MushroomSpotUpdate):
148|    """Update a mushroom spot"""
149|    try:
150|        # Get existing spot
151|        existing_spot = await db.mushroom_spots.find_one({"id": spot_id})
152|        if not existing_spot:
153|            raise HTTPException(status_code=404, detail="Mushroom spot not found")
154|        
155|        # Apply updates
156|        update_dict = {k: v for k, v in updates.dict().items() if v is not None}
157|        if update_dict:
158|            await db.mushroom_spots.update_one(
159|                {"id": spot_id}, 
160|                {"$set": update_dict}
161|            )
162|        
163|        # Return updated spot
164|        updated_spot = await db.mushroom_spots.find_one({"id": spot_id})
165|        return MushroomSpot(**updated_spot)
166|    
167|    except HTTPException:
168|        raise
169|    except Exception as e:
170|        raise HTTPException(status_code=500, detail=str(e))
171|
172|@api_router.delete("/mushroom-spots/{spot_id}")
173|async def delete_mushroom_spot(spot_id: str):
174|    """Delete a mushroom spot"""
175|    try:
176|        result = await db.mushroom_spots.delete_one({"id": spot_id})
177|        if result.deleted_count == 0:
178|            raise HTTPException(status_code=404, detail="Mushroom spot not found")
179|        return {"message": "Mushroom spot deleted successfully"}
180|    except HTTPException:
181|        raise
182|    except Exception as e:
183|        raise HTTPException(status_code=500, detail=str(e))
184|
185|@api_router.get("/mushroom-spots/nearby/{latitude}/{longitude}")
186|async def get_nearby_mushroom_spots(latitude: float, longitude: float, radius_km: float = 5.0):
187|    """Get mushroom spots within a certain radius (in kilometers)"""
188|    try:
189|        # Simple distance calculation (for more precision, use geospatial queries)
190|        # This is a basic implementation - for production, you'd use MongoDB's geospatial features
191|        all_spots = await db.mushroom_spots.find().to_list(1000)
192|        nearby_spots = []
193|        
194|        for spot_data in all_spots:
195|            spot = MushroomSpot(**spot_data)
196|            # Simple distance calculation (Haversine formula would be more accurate)
197|            lat_diff = abs(spot.latitude - latitude)
198|            lon_diff = abs(spot.longitude - longitude)
199|            # Rough approximation: 1 degree ≈ 111 km
200|            distance_km = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111
201|            
202|            if distance_km <= radius_km:
203|                nearby_spots.append(spot)
204|        
205|        return nearby_spots
206|    except Exception as e:
207|        raise HTTPException(status_code=500, detail=str(e))
208|
209|# Mushroom Database Endpoints
210|@api_router.get("/mushrooms", response_model=List[MushroomInfo])
211|async def get_mushrooms(search: Optional[str] = None):
212|    """Get all mushrooms or search by name"""
213|    try:
214|        if search:
215|            # Case-insensitive search by common or latin name
216|            mushrooms = await db.mushroom_database.find({
217|                "$or": [
218|                    {"common_name": {"$regex": search, "$options": "i"}},
219|                    {"latin_name": {"$regex": search, "$options": "i"}}
220|                ]
221|            }).to_list(100)
222|        else:
223|            mushrooms = await db.mushroom_database.find().to_list(100)
224|        
225|        return [MushroomInfo(**mushroom) for mushroom in mushrooms]
226|    except Exception as e:
227|        raise HTTPException(status_code=500, detail=str(e))
228|
229|@api_router.get("/mushrooms/{mushroom_id}", response_model=MushroomInfo)
230|async def get_mushroom(mushroom_id: str):
231|    """Get a specific mushroom by ID"""
232|    mushroom = await db.mushroom_database.find_one({"id": mushroom_id})
233|    if not mushroom:
234|        raise HTTPException(status_code=404, detail="Mushroom not found")
235|    return MushroomInfo(**mushroom)
236|
237|@api_router.post("/mushrooms", response_model=MushroomInfo)
238|async def create_mushroom(mushroom: MushroomInfoCreate):
239|    """Create a new mushroom entry (for admin use)"""
240|    mushroom_dict = mushroom.dict()
241|    mushroom_obj = MushroomInfo(**mushroom_dict)
242|    await db.mushroom_database.insert_one(mushroom_obj.dict())
243|    return mushroom_obj
244|
245|@api_router.put("/mushrooms/{mushroom_id}", response_model=MushroomInfo)
246|async def update_mushroom(mushroom_id: str, mushroom: MushroomInfoCreate):
247|    """Update a mushroom entry (for admin use)"""
248|    existing = await db.mushroom_database.find_one({"id": mushroom_id})
249|    if not existing:
250|        raise HTTPException(status_code=404, detail="Mushroom not found")
251|    
252|    mushroom_dict = mushroom.dict()
253|    mushroom_dict["id"] = mushroom_id  # Preserve the ID
254|    mushroom_obj = MushroomInfo(**mushroom_dict)
255|    
256|    await db.mushroom_database.replace_one({"id": mushroom_id}, mushroom_obj.dict())
257|    return mushroom_obj
258|
259|@api_router.delete("/mushrooms/{mushroom_id}")
260|async def delete_mushroom(mushroom_id: str):
261|    """Delete a mushroom entry (for admin use)"""
262|    result = await db.mushroom_database.delete_one({"id": mushroom_id})
263|    if result.deleted_count == 0:
264|        raise HTTPException(status_code=404, detail="Mushroom not found")
265|    return {"message": "Mushroom deleted successfully", "id": mushroom_id}
266|
267|# Include the router in the main app
268|app.include_router(api_router)
269|
270|app.add_middleware(
271|    CORSMiddleware,
272|    allow_credentials=True,
273|    allow_origins=["*"],
274|    allow_methods=["*"],
275|    allow_headers=["*"],
276|)
277|
278|# Configure logging
279|logging.basicConfig(
280|    level=logging.INFO,
281|    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
282|)
283|logger = logging.getLogger(__name__)
284|
285|@app.on_event("shutdown")
286|async def shutdown_db_client():
287|    client.close()
'''
