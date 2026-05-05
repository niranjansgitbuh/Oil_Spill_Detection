from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.layers import Conv2DTranspose
import base64
import asyncio
import websockets
import json
from datetime import datetime, timezone
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import io

# --- Monkey patch for backward compatibility ---
old_from_config = Conv2DTranspose.from_config
def new_from_config(config):
    config.pop("groups", None)
    return old_from_config(config)
Conv2DTranspose.from_config = staticmethod(new_from_config)

# --- Initialize FastAPI ---
app = FastAPI(
    title="Marine Oil Spill Detection API",
    description="API for oil spill detection and AIS ship tracking",
    version="1.0.0"
)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
MODEL_PATH = "Models/oilspill_unet.h5"
AIS_API_KEY = "98cd3429a4ef059a71e248835cbaf9719274a967"

# --- Load Model at Startup ---
model = None

@app.on_event("startup")
async def load_model():
    global model
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    print("✅ Model loaded successfully")

# --- Pydantic Models ---
class OilSpillResponse(BaseModel):
    prediction: str
    area_percent: float
    is_spill: bool
    overlay_image: str  # base64 encoded

class EmailAlertRequest(BaseModel):
    sender_email: EmailStr
    sender_password: str
    receiver_email: EmailStr
    area_percent: float

class AISStreamRequest(BaseModel):
    min_lat: float = 34.0
    max_lat: float = 71.0
    min_lon: float = -25.0
    max_lon: float = 45.0
    mmsi_list: Optional[List[str]] = None
    duration_sec: int = 15

class AISPosition(BaseModel):
    timestamp: str
    mmsi: Optional[int]
    lat: Optional[float]
    lon: Optional[float]
    sog: Optional[float]
    cog: Optional[float]
    true_heading: Optional[float]

# --- Helper Functions ---
def predict_image(image_array: np.ndarray):
    """Predict oil spill from image array"""
    img_resized = cv2.resize(image_array, (256, 256))
    input_img = np.expand_dims(img_resized, axis=0) / 255.0
    pred_mask = model.predict(input_img)[0, ..., 0]
    binary_mask = (pred_mask > 0.5).astype(np.uint8)
    area_percent = (np.sum(binary_mask) / binary_mask.size) * 100
    
    # Create overlay
    mask_resized = cv2.resize(binary_mask, (image_array.shape[1], image_array.shape[0]), 
                             interpolation=cv2.INTER_NEAREST)
    overlay = image_array.copy()
    overlay[mask_resized == 1] = [255, 0, 0]
    
    return area_percent, overlay

def encode_image_to_base64(image_array: np.ndarray) -> str:
    """Encode numpy array to base64 string"""
    _, buffer = cv2.imencode('.png', cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR))
    return base64.b64encode(buffer).decode('utf-8')

async def send_alert_email(sender_email: str, sender_password: str, 
                          receiver_email: str, area_percent: float):
    """Send alert email in background"""
    subject = "🚨 Oil Spill Alert Detected!"
    body = f"""
    Dear User,

    Our AI model has detected a potential oil spill from the uploaded image.

    🌊 Oil Spill Area Coverage: {area_percent:.2f}%

    Please log in to the Marine Oil Spill Monitoring System dashboard for more details.

    Regards,  
    Marine Oil Spill Detection System
    """

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
        return True
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# --- API Endpoints ---

@app.get("/")
async def root():
    return {
        "message": "Marine Oil Spill Detection API",
        "version": "1.0.0",
        "endpoints": {
            "predict": "/api/predict",
            "send_alert": "/api/send-alert",
            "ais_stream": "/api/ais/stream (WebSocket)"
        }
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.post("/api/predict", response_model=OilSpillResponse)
async def predict_oil_spill(file: UploadFile = File(...)):
    """
    Upload an image and detect oil spills
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Predict
        area_percent, overlay = predict_image(img)
        is_spill = area_percent > 0.5
        
        # Encode overlay image
        overlay_base64 = encode_image_to_base64(overlay)
        
        prediction_text = "Potential Oil Spill" if is_spill else "No Oil Spill"
        
        return OilSpillResponse(
            prediction=prediction_text,
            area_percent=round(area_percent, 2),
            is_spill=is_spill,
            overlay_image=overlay_base64
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/api/send-alert")
async def send_alert(request: EmailAlertRequest, background_tasks: BackgroundTasks):
    """
    Send email alert for detected oil spill
    """
    background_tasks.add_task(
        send_alert_email,
        request.sender_email,
        request.sender_password,
        request.receiver_email,
        request.area_percent
    )
    
    return {"message": "Alert email is being sent", "status": "queued"}

@app.websocket("/api/ais/stream")
async def ais_stream_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for streaming AIS ship positions
    """
    await websocket.accept()
    
    try:
        # Receive configuration from client
        config_data = await websocket.receive_text()
        config = json.loads(config_data)
        
        bbox = [[config['min_lat'], config['min_lon']], 
                [config['max_lat'], config['max_lon']]]
        mmsi_list = config.get('mmsi_list', [])
        duration_sec = config.get('duration_sec', 15)
        
        # Connect to AIS stream
        uri = "wss://stream.aisstream.io/v0/stream"
        subscribe_message = {
            "APIKey": AIS_API_KEY,
            "BoundingBoxes": [bbox],
            "FilterMessageTypes": ["PositionReport"]
        }
        if mmsi_list:
            subscribe_message["FiltersShipMMSI"] = mmsi_list
        
        start_time = asyncio.get_event_loop().time()
        
        async with websockets.connect(uri) as ais_websocket:
            await ais_websocket.send(json.dumps(subscribe_message))
            
            while asyncio.get_event_loop().time() - start_time < duration_sec:
                try:
                    message_json = await asyncio.wait_for(
                        ais_websocket.recv(), 
                        timeout=duration_sec
                    )
                    message = json.loads(message_json)
                    
                    if message.get("MessageType") == "PositionReport":
                        pr = message["Message"]["PositionReport"]
                        position_data = {
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "mmsi": pr.get("UserID"),
                            "lat": pr.get("Latitude"),
                            "lon": pr.get("Longitude"),
                            "sog": pr.get("Sog"),
                            "cog": pr.get("Cog"),
                            "true_heading": pr.get("TrueHeading"),
                        }
                        
                        # Send to Next.js client
                        await websocket.send_json(position_data)
                
                except asyncio.TimeoutError:
                    break
        
        # Send completion signal
        await websocket.send_json({"status": "complete"})
    
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)