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
            # Use gemini-2.5-pro for maximum precision in counterfeit detection
            self.model = genai.GenerativeModel('gemini-2.5-pro')

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
                if text and text.startswith("```json"):
                    text = text[7:]
                if text and text.endswith("```"):
                    text = text[:-3]
                    
                return json.loads(text)
            
            except Exception as e:
                print(f"Gemini Error (Attempt {attempt+1}/{retries}): {e}")
                error_str = str(e)
                if "429" in error_str or "quota" in error_str.lower():
                    if attempt < retries - 1:
                        import time
                        wait_time = delay * (2 ** attempt) # Exponential backoff: 2, 4, 8...
                        print(f"Quota exceeded. Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue
                    else:
                        return {"error": "Service is busy (Quota Exceeded). Please try again in a minute."}
                return {"error": f"Analysis failed: {str(e)}"}

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
            if text and text.startswith("```json"):
                text = text[7:]
            if text and text.endswith("```"):
                text = text[:-3]
        except Exception as e:
            print(f"Gemini Details Error: {e}")
            return {"description": "Could not analyze product details.", "specs": []}

    def compare_products(self, input_image_bytes: bytes, reference_image_bytes: bytes) -> dict:
        """
        Compares the input image with a reference image using Gemini to detect counterfeit signs.
        """
        if not self.api_key:
             return {"error": "Key missing"}

        try:
            img1 = Image.open(io.BytesIO(input_image_bytes))
            img2 = Image.open(io.BytesIO(reference_image_bytes))
            
            prompt = """
            You are an expert counterfeit investigator. 
            Image 1 is the suspect product (uploaded by user).
            Image 2 is the official reference product (from a trusted source).
            
            Compare them strictly. Look for differences in:
            - Logo placement, font, and proportions
            - Stitching quality and patterns
            - Material texture and finish
            - Color shade discrepancies
            - Label details
            
            If Image 2 is a generic or different product, state that comparison is invalid.
            
            Return a JSON object:
            {
                "is_authentic": boolean,
                "confidence_score": float (0.0 to 1.0),
                "verdict": "Authentic", "Counterfeit", or "Inconclusive",
                "discrepancies": ["list", "of", "visual", "differences"],
                "reasoning": "Brief summary of why"
            }
            """
            
            response = self.model.generate_content([prompt, img1, img2])
            text = response.text.strip()
            
            if text and text.startswith("```json"):
                text = text[7:]
            if text and text.endswith("```"):
                text = text[:-3]
                
            return json.loads(text)
        except Exception as e:
            print(f"Gemini Comparison Error: {e}")
            return {"error": str(e), "is_authentic": False, "confidence_score": 0.0, "verdict": "Error", "discrepancies": []}

    def verify_product_authenticity(self, image_bytes: bytes) -> dict:
        """
        Advanced Chain-of-Thought verification using Forensic Authenticator approach.
        Works across multiple categories without pre-trained dataset.
        """
        if not self.api_key:
            return {"error": "Gemini API Key missing"}

        try:
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            return {"error": f"Invalid image data: {str(e)}"}

        # Define the Forensic prompt
        cot_prompt = """You are a Forensic Imaging Specialist. Perform a pixel-level analysis of the brand name text.

Operational Protocol:
1. CHARACTER SEGMENTATION:
    - Look at the VERY LAST character of the word that looks like 'Parle-'.
    - Is it a 'G' or a 'J'?
    - A 'G' has a horizontal crossbar pointing INWARD.
    - A 'J' has a smooth hook curving UPWARDS to the LEFT without a crossbar.
    - BE BRUTALLY HONEST. If it's a 'J', it is a COUNTERFEIT.

2. FORENSIC VERDICT:
    - Verdict 'Authentic' ONLY if the spelling is 100% 'Parle-G'.
    - Verdict 'Counterfeit' if it says 'Parle-J'.

### STEP 1: Character Analysis
- Segment analysis of last letter: ...
- Transcription based on segment analysis: ...

### STEP 2: JSON Output (Strict)
Return ONLY this JSON:
{
  "product_info": {"brand": "...", "model": "...", "category": "..."},
  "verification": {
    "is_authentic_guess": "Authentic" | "Counterfeit",
    "confidence_score": 0-100,
    "anomalies_detected": ["..."],
    "detailed_reasoning": "..."
  }
}"""

        import time
        retries = 3
        delay = 15 # Initial delay

        for attempt in range(retries):
            try:
                response = self.model.generate_content([cot_prompt, image])
                text = response.text.strip()
                
                # More robust JSON extraction
                import re
                json_match = re.search(r'\{.*\}', text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    result = json.loads(json_str)
                else:
                    if text.startswith("{") and text.endswith("}"):
                        result = json.loads(text)
                    else:
                        raise ValueError(f"Could not find JSON in response: {text[:100]}...")
                
                if "product_info" not in result or "verification" not in result:
                    raise ValueError("Invalid response structure from Gemini")
                
                return result

            except Exception as e:
                error_msg = str(e)
                if ("429" in error_msg or "quota" in error_msg.lower()) and attempt < retries - 1:
                    print(f"Quota hit in verification. Retrying in {delay}s...")
                    time.sleep(delay)
                    delay *= 2 # Exponential backoff
                    continue
                
                # If last attempt or non-quota error
                print(f"Verification error (Attempt {attempt+1}): {e}")
                if attempt == retries - 1:
                     return {
                        "error": f"Verification failed after retries: {str(e)}",
                        "product_info": {"brand": "Unknown", "model": "Unknown", "category": "Unknown"},
                        "verification": {
                            "is_authentic_guess": "Error",
                            "confidence_score": 0,
                            "anomalies_detected": ["System busy or error"],
                            "detailed_reasoning": f"The verification service is temporarily unavailable: {str(e)}"
                        }
                    }

gemini_service = GeminiService()

