import google.generativeai as genai
import os
import json
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("Warning: GEMINI_API_KEY not set.")
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')

    def extract_features(self, image_bytes: bytes) -> dict:
        if not self.api_key:
             return {"error": "Gemini API Key missing"}

        retries = 3
        delay = 2  # Start with 2 seconds

        for attempt in range(retries):
            try:
                image = Image.open(io.BytesIO(image_bytes))
                
                prompt = """
                You are an expert in product authentication. Analyze this image.
                Extract the following details to help verify if it is authentic:
                1. Brand Name
                2. Product Name / Model
                3. Packaging details (text, logo placement, colors)
                4. A search query to find an official reference image of this exact product.

                Return ONLY a valid JSON object with this structure:
                {
                    "brand": "string",
                    "product_name": "string",
                    "features": ["feature1", "feature2"],
                    "search_query": "string"
                }
                Do not include markdown formatting like ```json ... ```. Just the raw JSON string.
                """
                
                response = self.model.generate_content([prompt, image])
                text = response.text.strip()
                
                # Cleanup markdown if present
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                    
                return json.loads(text)
            
            except Exception as e:
                print(f"Gemini Error (Attempt {attempt+1}/{retries}): {e}")
                if "429" in str(e):
                    if attempt < retries - 1:
                        import time
                        print(f"Quota exceeded. Retrying in {delay} seconds...")
                        time.sleep(delay)
                        delay *= 2  # Exponential backoff
                        continue
                    else:
                        return {"error": "Gemini API Quota Exceeded. Please try again later."}
                return {"error": str(e)}

    def identify_product(self, image_bytes: bytes) -> str:
        """
        Identifies the product in the image and returns a search query string.
        """
        if not self.api_key:
             return "unknown product"

        try:
            image = Image.open(io.BytesIO(image_bytes))
            prompt = """
            Identify this product specifically for buying online. 
            Return ONLY the product name (Brand + Model + Colorway if applicable).
            Do not include any other text.
            """
            response = self.model.generate_content([prompt, image])
            return response.text.strip()
        except Exception as e:
            print(f"Gemini Identification Error: {e}")
            return "unknown product"

    def analyze_for_details(self, image_bytes: bytes) -> dict:
        """
        Analyzes image to provide detailed product specifications.
        """
        if not self.api_key:
             return {"error": "Key missing"}

        try:
            image = Image.open(io.BytesIO(image_bytes))
            prompt = """
            Analyze this product and provide detailed specifications.
            Return a JSON object with this structure:
            {
                "description": "A detailed paragraph describing the product.",
                "specs": [
                    {"label": "Brand", "value": "string"},
                    {"label": "Model", "value": "string"},
                    {"label": "Color", "value": "string"},
                    {"label": "Material", "value": "string"},
                    {"label": "Release Date", "value": "string (estimate if unknown)"}
                ]
            }
            """
            response = self.model.generate_content([prompt, image])
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text)
        except Exception as e:
            print(f"Gemini Details Error: {e}")
            return {"description": "Could not analyze product details.", "specs": []}

gemini_service = GeminiService()
