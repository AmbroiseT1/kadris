from fastapi import APIRouter, HTTPException, Query
import httpx
from diskcache import Cache
import os

router = APIRouter()

# Cache persistent sur le disque (dans le dossier .cache du backend)
cache = Cache(".cache")

@router.get("/quartier")
async def proxy_quartier(lat: float, lon: float):
    """
    Proxy pour l'API Overpass avec mise en cache (7 jours).
    """
    cache_key = f"quartier_{lat}_{lon}"
    
    # 1. Vérifier le cache
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    # 2. Si pas en cache, appeler Overpass
    query = f"""
      [out:json][timeout:25];
      (
        node["amenity"~"school|kindergarten|college|university"](around:1000, {lat}, {lon});
        way["amenity"~"school|kindergarten|college|university"](around:1000, {lat}, {lon});
        node["amenity"~"doctors|pharmacy|hospital|dentist"](around:1000, {lat}, {lon});
        
        node["shop"~"bakery|butcher|supermarket|convenience|greengrocer|seafood|cheese|pastry"](around:1000, {lat}, {lon});
        way["shop"~"bakery|butcher|supermarket|convenience|greengrocer|seafood|cheese|pastry"](around:1000, {lat}, {lon});
        
        node["amenity"~"restaurant|cafe|fast_food|bar|pub"](around:1000, {lat}, {lon});
        way["amenity"~"restaurant|cafe|fast_food|bar|pub"](around:1000, {lat}, {lon});

        node["highway"="bus_stop"](around:1000, {lat}, {lon});
        node["railway"~"station|tram_stop"](around:1000, {lat}, {lon});
        node["leisure"~"park|garden|sports_centre"](around:1000, {lat}, {lon});
        way["leisure"~"park|garden|sports_centre"](around:1000, {lat}, {lon});
        node["amenity"~"library|cinema|theatre"](around:1000, {lat}, {lon});
        node["amenity"~"police|fire_station"](around:1500, {lat}, {lon});
        node["amenity"~"post_office|town_hall"](around:1000, {lat}, {lon});
        
        way["highway"~"motorway|trunk|primary|secondary|tertiary"](around:300, {lat}, {lon});
        way["railway"="rail"](around:300, {lat}, {lon});
        way["aeroway"~"aerodrome|runway"](around:3000, {lat}, {lon});
        node["aeroway"~"aerodrome"](around:3000, {lat}, {lon});
        way["landuse"="industrial"](around:500, {lat}, {lon});
      );
      out center; 
    """
    
    url = "https://overpass-api.de/api/interpreter"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params={"data": query}, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            # 3. Mettre en cache pour 7 jours (604800 secondes)
            cache.set(cache_key, data, expire=604800)
            
            return data
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Overpass API Error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy Error: {str(e)}")
