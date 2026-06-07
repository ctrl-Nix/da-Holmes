from fastapi import APIRouter, HTTPException, Query, Request, UploadFile, File
from pydantic import BaseModel
import logging
import asyncio
import io
from PIL import Image

logger = logging.getLogger(__name__)

router = APIRouter()

# Global variables to hold the loaded models (Lazy Loading)
ner_pipeline = None

class TextPayload(BaseModel):
    text: str

def load_ner_model():
    global ner_pipeline
    if ner_pipeline is None:
        try:
            logger.info("Loading Local NER Model (dslim/bert-base-NER)...")
            from transformers import pipeline
            # Using a very lightweight NER model
            ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
            logger.info("NER Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load NER model: {e}")
            raise RuntimeError(f"Failed to load NER model: {e}")

@router.post("/extract-entities", tags=["Local ML"])
async def extract_entities(payload: TextPayload):
    """
    Locally extract Named Entities (Persons, Organizations, Locations, MISC) from text.
    100% Local Inference - No Data leaves the machine.
    """
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    try:
        # Load model lazily on first request
        loop = asyncio.get_running_loop()
        if ner_pipeline is None:
            await loop.run_in_executor(None, load_ner_model)

        # Run inference in a threadpool to avoid blocking the async event loop
        def run_inference():
            return ner_pipeline(text)
            
        entities = await loop.run_in_executor(None, run_inference)
        
        # Clean up output format
        cleaned_entities = []
        for ent in entities:
            # Convert np.float32 to standard float for JSON serialization
            score = float(ent.get('score', 0.0))
            cleaned_entities.append({
                "entity_group": ent.get('entity_group'),
                "word": ent.get('word'),
                "score": score,
                "start": ent.get('start'),
                "end": ent.get('end')
            })
            
        return {
            "status": "success",
            "model_used": "dslim/bert-base-NER (Local)",
            "entities": cleaned_entities
        }
    except Exception as e:
        logger.error(f"Error during ML inference: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# YOLO Object Detection Lazy Loading
yolo_model = None

def load_yolo_model():
    global yolo_model
    if yolo_model is None:
        try:
            logger.info("Loading Local YOLOv8 Nano Model...")
            from ultralytics import YOLO
            # Ultralytics will auto-download yolov8n.pt if not present locally
            yolo_model = YOLO('yolov8n.pt')
            logger.info("YOLOv8 Nano Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise RuntimeError(f"Failed to load YOLO model: {e}")

@router.post("/detect-objects", tags=["Local ML"])
async def detect_objects(file: UploadFile = File(...)):
    """
    Locally detect objects in an image using YOLOv8n.
    100 percent Local Inference.
    """
    try:
        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        loop = asyncio.get_running_loop()
        if yolo_model is None:
            await loop.run_in_executor(None, load_yolo_model)
            
        def run_yolo():
            return yolo_model(img)
            
        results = await loop.run_in_executor(None, run_yolo)
        
        detected_items = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                # Class name
                c = int(box.cls[0])
                name = yolo_model.names[c]
                # Confidence
                conf = float(box.conf[0])
                # Coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                detected_items.append({
                    "label": name,
                    "confidence": conf,
                    "box": [x1, y1, x2, y2]
                })
                
        return {
            "status": "success",
            "model_used": "YOLOv8 Nano (Local)",
            "objects": detected_items
        }
    except Exception as e:
        logger.error(f"Error during YOLO inference: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Predictive ML Lazy Loading
bot_model = None
import pickle
import os

class ProfileStats(BaseModel):
    follower_count: int
    following_count: int
    account_age_days: int
    bio_length: int
    is_verified: bool

def load_bot_model():
    global bot_model
    if bot_model is None:
        try:
            logger.info("Loading Local Random Forest Bot Model...")
            model_path = os.path.join("app", "api", "models", "bot_model.pkl")
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model not found at {model_path}. Please run train_bot_model.py first.")
            with open(model_path, "rb") as f:
                bot_model = pickle.load(f)
            logger.info("Bot Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load bot model: {e}")
            raise RuntimeError(f"Failed to load bot model: {e}")

@router.post("/predict-bot", tags=["Local ML"])
async def predict_bot(stats: ProfileStats):
    """
    Predict if a social media profile is a bot/fake using a Local Random Forest Model.
    """
    try:
        loop = asyncio.get_running_loop()
        if bot_model is None:
            await loop.run_in_executor(None, load_bot_model)
            
        def run_prediction():
            import numpy as np
            # [follower_count, following_count, account_age_days, bio_length, is_verified]
            features = np.array([[
                stats.follower_count,
                stats.following_count,
                stats.account_age_days,
                stats.bio_length,
                1 if stats.is_verified else 0
            ]])
            prob = bot_model.predict_proba(features)[0]
            is_bot = bool(bot_model.predict(features)[0] == 1)
            bot_score = float(prob[1] * 100) # Probability of class 1 (bot)
            return is_bot, bot_score
            
        is_bot, bot_score = await loop.run_in_executor(None, run_prediction)
        
        return {
            "status": "success",
            "model_used": "RandomForestClassifier (Local)",
            "is_bot": is_bot,
            "bot_probability": bot_score
        }
    except Exception as e:
        logger.error(f"Error during Bot Prediction inference: {e}")
        raise HTTPException(status_code=500, detail=str(e))
