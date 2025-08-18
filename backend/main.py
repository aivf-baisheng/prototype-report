from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path
from typing import List, Dict, Any
from pydantic import BaseModel

class PromptUpdate(BaseModel):
    prompt_id: str
    score: int
    notes: str

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
                    "percentage": bundle["percentage"],
                    "recipes": [
                        {
                            "name": recipe["recipe_name"],
                            "percentage": recipe["percentage"],
                            "ci_minimum_band": recipe["ci_minimum_band"],
                            "ci_maximum_band": recipe["ci_maximum_band"],
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

@app.post("/api/bundles/update_prompt")
async def update_prompt(update: PromptUpdate):
    try:
        print(f"Received update request: {update}")
        # Read current data
        with open(BUNDLES_TEST_FILE, 'r') as f:
            data = json.load(f)

        # Find and update the prompt
        found = False
        bundle_idx, recipe_idx, prompt_idx = map(int, update.prompt_id.split('-'))
        print(f"Looking for prompt at indices: bundle={bundle_idx}, recipe={recipe_idx}, prompt={prompt_idx}")

        # Direct access using indices
        try:
            target_prompt = data["bundles"][bundle_idx]["recipes"][recipe_idx]["prompts"][prompt_idx]
            print(f"Found prompt: {target_prompt}")
            target_prompt["score"] = update.score
            target_prompt["notes"] = update.notes
            found = True
            print(f"Updated prompt to: score={update.score}, notes={update.notes}")
        except (IndexError, KeyError) as e:
            print(f"Error accessing prompt: {e}")

        if not found:
            raise HTTPException(status_code=404, detail="Prompt not found")

        # Write updated data back to file
        print("Writing updated data back to file...")
        with open(BUNDLES_TEST_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        print("File updated successfully")

        return {"message": "Prompt updated successfully"}

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Bundles data file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error parsing bundles data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
