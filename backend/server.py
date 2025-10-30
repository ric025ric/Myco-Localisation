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
125|async def get_mushroom_spots(created_by: str = None):
126|    """Get mushroom spots filtered by user"""
127|    try:
128|        # Filter by created_by if provided
129|        query = {}
130|        if created_by:
131|            query["created_by"] = created_by
132|        
133|        spots = await db.mushroom_spots.find(query).sort("timestamp", -1).to_list(1000)
134|        return [MushroomSpot(**spot) for spot in spots]
135|    except Exception as e:
136|        raise HTTPException(status_code=500, detail=str(e))
137|
138|@api_router.get("/mushroom-spots/{spot_id}", response_model=MushroomSpot)
139|async def get_mushroom_spot(spot_id: str):
140|    """Get a specific mushroom spot by ID"""
141|    try:
142|        spot = await db.mushroom_spots.find_one({"id": spot_id})
143|        if not spot:
144|            raise HTTPException(status_code=404, detail="Mushroom spot not found")
145|        return MushroomSpot(**spot)
146|    except HTTPException:
147|        raise
148|    except Exception as e:
149|        raise HTTPException(status_code=500, detail=str(e))
150|
151|@api_router.put("/mushroom-spots/{spot_id}", response_model=MushroomSpot)
152|async def update_mushroom_spot(spot_id: str, updates: MushroomSpotUpdate):
153|    """Update a mushroom spot"""
154|    try:
155|        # Get existing spot
156|        existing_spot = await db.mushroom_spots.find_one({"id": spot_id})
157|        if not existing_spot:
158|            raise HTTPException(status_code=404, detail="Mushroom spot not found")
159|        
160|        # Apply updates
161|        update_dict = {k: v for k, v in updates.dict().items() if v is not None}
162|        if update_dict:
163|            await db.mushroom_spots.update_one(
164|                {"id": spot_id}, 
165|                {"$set": update_dict}
166|            )
167|        
168|        # Return updated spot
169|        updated_spot = await db.mushroom_spots.find_one({"id": spot_id})
170|        return MushroomSpot(**updated_spot)
171|    
172|    except HTTPException:
173|        raise
174|    except Exception as e:
175|        raise HTTPException(status_code=500, detail=str(e))
176|
177|@api_router.delete("/mushroom-spots/{spot_id}")
178|async def delete_mushroom_spot(spot_id: str):
179|    """Delete a mushroom spot"""
180|    try:
181|        result = await db.mushroom_spots.delete_one({"id": spot_id})
182|        if result.deleted_count == 0:
183|            raise HTTPException(status_code=404, detail="Mushroom spot not found")
184|        return {"message": "Mushroom spot deleted successfully"}
185|    except HTTPException:
186|        raise
187|    except Exception as e:
188|        raise HTTPException(status_code=500, detail=str(e))
189|
190|@api_router.get("/mushroom-spots/nearby/{latitude}/{longitude}")
191|async def get_nearby_mushroom_spots(latitude: float, longitude: float, radius_km: float = 5.0):
192|    """Get mushroom spots within a certain radius (in kilometers)"""
193|    try:
194|        # Simple distance calculation (for more precision, use geospatial queries)
195|        # This is a basic implementation - for production, you'd use MongoDB's geospatial features
196|        all_spots = await db.mushroom_spots.find().to_list(1000)
197|        nearby_spots = []
198|        
199|        for spot_data in all_spots:
200|            spot = MushroomSpot(**spot_data)
201|            # Simple distance calculation (Haversine formula would be more accurate)
202|            lat_diff = abs(spot.latitude - latitude)
203|            lon_diff = abs(spot.longitude - longitude)
204|            # Rough approximation: 1 degree ≈ 111 km
205|            distance_km = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111
206|            
207|            if distance_km <= radius_km:
208|                nearby_spots.append(spot)
209|        
210|        return nearby_spots
211|    except Exception as e:
212|        raise HTTPException(status_code=500, detail=str(e))
213|
214|# Mushroom Database Endpoints
215|@api_router.get("/mushrooms", response_model=List[MushroomInfo])
216|async def get_mushrooms(search: Optional[str] = None):
217|    """Get all mushrooms or search by name"""
218|    try:
219|        if search:
220|            # Case-insensitive search by common or latin name
221|            mushrooms = await db.mushroom_database.find({
222|                "$or": [
223|                    {"common_name": {"$regex": search, "$options": "i"}},
224|                    {"latin_name": {"$regex": search, "$options": "i"}}
225|                ]
226|            }).to_list(100)
227|        else:
228|            mushrooms = await db.mushroom_database.find().to_list(100)
229|        
230|        return [MushroomInfo(**mushroom) for mushroom in mushrooms]
231|    except Exception as e:
232|        raise HTTPException(status_code=500, detail=str(e))
233|
234|@api_router.get("/mushrooms/{mushroom_id}", response_model=MushroomInfo)
235|async def get_mushroom(mushroom_id: str):
236|    """Get a specific mushroom by ID"""
237|    mushroom = await db.mushroom_database.find_one({"id": mushroom_id})
238|    if not mushroom:
239|        raise HTTPException(status_code=404, detail="Mushroom not found")
240|    return MushroomInfo(**mushroom)
241|
242|@api_router.post("/mushrooms", response_model=MushroomInfo)
243|async def create_mushroom(mushroom: MushroomInfoCreate):
244|    """Create a new mushroom entry (for admin use)"""
245|    mushroom_dict = mushroom.dict()
246|    mushroom_obj = MushroomInfo(**mushroom_dict)
247|    await db.mushroom_database.insert_one(mushroom_obj.dict())
248|    return mushroom_obj
249|
250|@api_router.put("/mushrooms/{mushroom_id}", response_model=MushroomInfo)
251|async def update_mushroom(mushroom_id: str, mushroom: MushroomInfoCreate):
252|    """Update a mushroom entry (for admin use)"""
253|    existing = await db.mushroom_database.find_one({"id": mushroom_id})
254|    if not existing:
255|        raise HTTPException(status_code=404, detail="Mushroom not found")
256|    
257|    mushroom_dict = mushroom.dict()
258|    mushroom_dict["id"] = mushroom_id  # Preserve the ID
259|    mushroom_obj = MushroomInfo(**mushroom_dict)
260|    
261|    await db.mushroom_database.replace_one({"id": mushroom_id}, mushroom_obj.dict())
262|    return mushroom_obj
263|
264|@api_router.delete("/mushrooms/{mushroom_id}")
265|async def delete_mushroom(mushroom_id: str):
266|    """Delete a mushroom entry (for admin use)"""
267|    result = await db.mushroom_database.delete_one({"id": mushroom_id})
268|    if result.deleted_count == 0:
269|        raise HTTPException(status_code=404, detail="Mushroom not found")
270|    return {"message": "Mushroom deleted successfully", "id": mushroom_id}
271|
272|# Include the router in the main app
273|app.include_router(api_router)
274|
275|app.add_middleware(
276|    CORSMiddleware,
277|    allow_credentials=True,
278|    allow_origins=["*"],
279|    allow_methods=["*"],
280|    allow_headers=["*"],
281|)
282|
283|# Configure logging
284|logging.basicConfig(
285|    level=logging.INFO,
286|    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
287|)
288|logger = logging.getLogger(__name__)
289|
290|@app.on_event("shutdown")
291|async def shutdown_db_client():
292|    client.close()
