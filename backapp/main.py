from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import requests
from dotenv import load_dotenv

from services.gemini_service import gemini_service
from services.search_service import search_service
from services.verification_service import verification_service

# Load environment variables
load_dotenv()

app = FastAPI(title="Counterfeit Detection API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Counterfeit Detection API is running"}

@app.post("/verify")
async def verify_product(file: UploadFile = File(...)):
    """
    Verifies if a product image is authentic by:
    1. Extracting features using Gemini.
    2. Finding a reference image via Search.
    3. Comparing images using CNN embeddings.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    result = {
        "filename": file.filename,
        "input_analysis": None,
        "reference_search": None,
        "verification_result": None
    }

    try:
        # 1. Read file
        content = await file.read()
        
        # 2. Extract Features (Gemini)
        print("Analyzing image with Gemini...")
        gemini_data = gemini_service.extract_features(content)
        result["input_analysis"] = gemini_data
        
        if "error" in gemini_data:
            return result
            
        search_query = gemini_data.get("search_query")
        if not search_query:
            print("Gemini failed to generate search query. Using filename/default.")
            search_query = file.filename or "product"
            gemini_data["search_query"] = search_query 
            # Continue instead of returning error
            # result["input_analysis"]["error"] = "No search query generated"
            # return result

        # 3. Find Reference Image (Search)
        print(f"Searching for reference image: {search_query}")
        ref_url = search_service.find_reference_image(search_query)
        result["reference_search"] = {"query": search_query, "found_url": ref_url}
        
        if not ref_url:
            result["verification_result"] = {"error": "Reference image not found"}
            return result

        # 4. Download Reference Image
        print(f"Downloading reference image from {ref_url}...")
        try:
            # Fake headers to avoid some blocking
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'} 
            ref_resp = requests.get(ref_url, headers=headers, timeout=10)
            if ref_resp.status_code != 200:
                 result["verification_result"] = {"error": f"Failed to download reference image. Status: {ref_resp.status_code}"}
                 return result
            ref_bytes = ref_resp.content
        except Exception as e:
            result["verification_result"] = {"error": f"Failed to download reference image: {str(e)}"}
            return result

        # 5. Compare Images (Hybrid Approach: CNN + Gemini)
        print("Comparing images with CNN...")
        cnn_result = verification_service.compare_images(content, ref_bytes)
        
        print("Comparing images with Gemini (Visual Analysis)...")
        gemini_result = gemini_service.compare_products(content, ref_bytes)
        
        # Merge results
        # Using Gemini's confidence if available, otherwise falling back to CNN
        final_score = gemini_result.get("confidence_score", 0) if gemini_result.get("is_authentic") else cnn_result["similarity_score"]
        
        result["verification_result"] = {
            "is_authentic": gemini_result.get("is_authentic", cnn_result["is_authentic"]),
            "confidence_score": final_score,
            "verdict": gemini_result.get("verdict", cnn_result["verdict"]),
            "match_score": cnn_result["similarity_score"], # Keep raw CNN score
            "gemini_analysis": gemini_result, # Full details
            "cnn_analysis": cnn_result
        }

    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    return result

@app.post("/price")
async def check_price(file: UploadFile = File(...), sort: str = "price_asc"):
    """
    Checks online prices for the product in the image.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        content = await file.read()
        
        # 1. Identify Product
        print("Identifying product for pricing...")
        product_name = gemini_service.identify_product(content)
        
        if product_name == "unknown product":
            return {"error": "Could not identify product", "prices": []}
            
        # 2. Find Prices
        print(f"Finding prices for: {product_name}")
        prices = search_service.find_product_prices(product_name)
        
        # 3. Sort Results
        if sort == "price_asc":
            prices.sort(key=lambda x: x["price"])
        elif sort == "price_desc":
            prices.sort(key=lambda x: x["price"], reverse=True)
        elif sort == "rating":
            prices.sort(key=lambda x: x["rating"], reverse=True)
            
        return {
            "product_name": product_name,
            "prices": prices
        }

    except Exception as e:
        print(f"Price Check Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/details")
async def get_details(file: UploadFile = File(...)):
    """
    Analyzes image for detailed product specifications.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        content = await file.read()
        print("Analyzing for details...")
        details = gemini_service.analyze_for_details(content)
        return details

    except Exception as e:
        print(f"Details Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
