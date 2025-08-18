from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path
from typing import List, Dict, Any

app = FastAPI()

# Configure CORS - More permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Path to the JSON files
BUNDLES_TEST_FILE = Path(__file__).parent / "data" / "bundlestest.json"

@app.get("/")
async def read_root():
    return {"message": "Bundle API is running"}

@app.get("/api/bundles")
async def get_bundles():
    print("Received request for /api/bundles")
    try:
        with open(BUNDLES_TEST_FILE, 'r') as f:
            data = json.load(f)
            print("Successfully loaded bundles data:", data)
            
            # Transform the data to match the frontend's expected format
            bundles = []
            for bundle in data["bundles"]:
                transformed_bundle = {
                    "name": bundle["name"],
                    "score": bundle["percentage"],  # Frontend expects 'score' instead of 'percentage'
                    "recipes": [
                        {
                            "name": recipe["recipe_name"],
                            "score": recipe["percentage"],
                            "prompts": recipe["prompts"]
                        }
                        for recipe in bundle["recipes"]
                    ]
                }
                bundles.append(transformed_bundle)
            
            return bundles
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Bundles data file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error parsing bundles data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
