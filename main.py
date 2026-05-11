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

# ==========================================================
# 🔹 MONKEY PATCH FOR MODEL COMPATIBILITY
# ==========================================================
# Removes unsupported "groups" parameter from Conv2DTranspose
# layer configuration while loading older TensorFlow models.

old_from_config = Conv2DTranspose.from_config

def new_from_config(config):
    config.pop("groups", None)
    return old_from_config(config)

Conv2DTranspose.from_config = staticmethod(new_from_config)

# ==========================================================
# 🔹 INITIALIZE FASTAPI APPLICATION
# ==========================================================

app = FastAPI(
    title="Marine Oil Spill Detection API",
    description="API for oil spill detection and AIS ship tracking",
    version="1.0.0"
)

# ==========================================================
# 🔹 CORS CONFIGURATION
# ==========================================================
# Allows frontend applications (Next.js running on localhost:3000)
# to communicate with this backend API.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# 🔹 GLOBAL CONFIGURATION
# ==========================================================

# Path of trained UNet model
MODEL_PATH = "Models/oilspill_unet.h5"

# AIS Stream API Key
AIS_API_KEY = "98cd3429a4ef059a71e248835cbaf9719274a967"

# Global variable for model
model = None

# ==========================================================
# 🔹 LOAD MODEL AT APPLICATION STARTUP
# ==========================================================
# Loads the TensorFlow model once when the server starts.

@app.on_event("startup")
async def load_model():
    global model
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    print("✅ Model loaded successfully")

# ==========================================================
# 🔹 PYDANTIC DATA MODELS
# ==========================================================

class OilSpillResponse(BaseModel):
    """
    Response model returned after oil spill prediction.
    """
    prediction: str
    area_percent: float
    is_spill: bool
    overlay_image: str  # Base64 encoded image


class EmailAlertRequest(BaseModel):
    """
    Request body for sending email alerts.
    """
    sender_email: EmailStr
    sender_password: str
    receiver_email: EmailStr
    area_percent: float


class AISStreamRequest(BaseModel):
    """
    Configuration model for AIS streaming.
    """
    min_lat: float = 34.0
    max_lat: float = 71.0
    min_lon: float = -25.0
    max_lon: float = 45.0
    mmsi_list: Optional[List[str]] = None
    duration_sec: int = 15


class AISPosition(BaseModel):
    """
    Model representing AIS ship position data.
    """
    timestamp: str
    mmsi: Optional[int]
    lat: Optional[float]
    lon: Optional[float]
    sog: Optional[float]
    cog: Optional[float]
    true_heading: Optional[float]

# ==========================================================
# 🔹 HELPER FUNCTIONS
# ==========================================================

def predict_image(image_array: np.ndarray):
    """
    Predict oil spill area from satellite image.

    Steps:
    1. Resize image to model input size
    2. Normalize image
    3. Run model prediction
    4. Create binary segmentation mask
    5. Calculate spill area percentage
    6. Create red overlay on spill regions
    """

    # Resize image to 256x256 for model input
    img_resized = cv2.resize(image_array, (256, 256))

    # Normalize image and add batch dimension
    input_img = np.expand_dims(img_resized, axis=0) / 255.0

    # Predict segmentation mask
    pred_mask = model.predict(input_img)[0, ..., 0]

    # Convert probabilities to binary mask
    binary_mask = (pred_mask > 0.5).astype(np.uint8)

    # Calculate oil spill area percentage
    area_percent = (np.sum(binary_mask) / binary_mask.size) * 100

    # Resize mask back to original image size
    mask_resized = cv2.resize(
        binary_mask,
        (image_array.shape[1], image_array.shape[0]),
        interpolation=cv2.INTER_NEAREST
    )

    # Create overlay image
    overlay = image_array.copy()

    # Mark spill area with red color
    overlay[mask_resized == 1] = [255, 0, 0]

    return area_percent, overlay


def encode_image_to_base64(image_array: np.ndarray) -> str:
    """
    Convert NumPy image array into Base64 encoded string.
    Used for sending image data through API response.
    """

    _, buffer = cv2.imencode(
        '.png',
        cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
    )

    return base64.b64encode(buffer).decode('utf-8')


async def send_alert_email(
    sender_email: str,
    sender_password: str,
    receiver_email: str,
    area_percent: float
):
    """
    Sends an email alert when oil spill is detected.
    """

    subject = "🚨 Oil Spill Alert Detected!"

    body = f"""
    Dear User,

    Our AI model has detected a potential oil spill from the uploaded image.

    🌊 Oil Spill Area Coverage: {area_percent:.2f}%

    Please log in to the Marine Oil Spill Monitoring System dashboard for more details.

    Regards,
    Marine Oil Spill Detection System
    """

    # Create email message object
    msg = MIMEMultipart()

    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject

    # Attach email body
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Connect to Gmail SMTP server
        with smtplib.SMTP('smtp.gmail.com', 587) as server:

            # Start TLS encryption
            server.starttls()

            # Login with sender credentials
            server.login(sender_email, sender_password)

            # Send email
            server.send_message(msg)

        return True

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )

# ==========================================================
# 🔹 API ROUTES / ENDPOINTS
# ==========================================================

@app.get("/")
async def root():
    """
    Root endpoint of API.
    Displays API information and available routes.
    """

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
    """
    Health check endpoint.
    Verifies whether API and model are running correctly.
    """

    return {
        "status": "healthy",
        "model_loaded": model is not None
    }


@app.post("/api/predict", response_model=OilSpillResponse)
async def predict_oil_spill(file: UploadFile = File(...)):
    """
    Upload satellite image and detect oil spill.
    """

    # Validate uploaded file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="File must be an image"
        )

    try:
        # Read uploaded image
        contents = await file.read()

        # Convert bytes into NumPy array
        nparr = np.frombuffer(contents, np.uint8)

        # Decode image using OpenCV
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Run oil spill prediction
        area_percent, overlay = predict_image(img)

        # Check if spill exists
        is_spill = area_percent > 0.5

        # Convert overlay image to Base64
        overlay_base64 = encode_image_to_base64(overlay)

        # Prediction label
        prediction_text = (
            "Potential Oil Spill"
            if is_spill else
            "No Oil Spill"
        )

        # Return API response
        return OilSpillResponse(
            prediction=prediction_text,
            area_percent=round(area_percent, 2),
            is_spill=is_spill,
            overlay_image=overlay_base64
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@app.post("/api/send-alert")
async def send_alert(
    request: EmailAlertRequest,
    background_tasks: BackgroundTasks
):
    """
    Queue email alert in background task.
    """

    background_tasks.add_task(
        send_alert_email,
        request.sender_email,
        request.sender_password,
        request.receiver_email,
        request.area_percent
    )

    return {
        "message": "Alert email is being sent",
        "status": "queued"
    }


@app.websocket("/api/ais/stream")
async def ais_stream_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time AIS ship tracking.
    Streams live vessel positions from AISStream API.
    """

    # Accept WebSocket connection
    await websocket.accept()

    try:
        # Receive configuration from frontend client
        config_data = await websocket.receive_text()

        # Convert JSON string into Python dictionary
        config = json.loads(config_data)

        # Create bounding box coordinates
        bbox = [
            [config['min_lat'], config['min_lon']],
            [config['max_lat'], config['max_lon']]
        ]

        # Optional MMSI filters
        mmsi_list = config.get('mmsi_list', [])

        # Stream duration
        duration_sec = config.get('duration_sec', 15)

        # AIS WebSocket endpoint
        uri = "wss://stream.aisstream.io/v0/stream"

        # Subscription message
        subscribe_message = {
            "APIKey": AIS_API_KEY,
            "BoundingBoxes": [bbox],
            "FilterMessageTypes": ["PositionReport"]
        }

        # Add MMSI filters if provided
        if mmsi_list:
            subscribe_message["FiltersShipMMSI"] = mmsi_list

        # Record stream start time
        start_time = asyncio.get_event_loop().time()

        # Connect to AIS stream server
        async with websockets.connect(uri) as ais_websocket:

            # Send subscription request
            await ais_websocket.send(json.dumps(subscribe_message))

            # Stream data until duration ends
            while (
                asyncio.get_event_loop().time() - start_time
                < duration_sec
            ):

                try:
                    # Receive AIS message
                    message_json = await asyncio.wait_for(
                        ais_websocket.recv(),
                        timeout=duration_sec
                    )

                    # Convert JSON string into dictionary
                    message = json.loads(message_json)

                    # Process only PositionReport messages
                    if message.get("MessageType") == "PositionReport":

                        pr = message["Message"]["PositionReport"]

                        # Extract required fields
                        position_data = {
                            "timestamp": datetime.now(
                                timezone.utc
                            ).isoformat(),

                            "mmsi": pr.get("UserID"),
                            "lat": pr.get("Latitude"),
                            "lon": pr.get("Longitude"),
                            "sog": pr.get("Sog"),
                            "cog": pr.get("Cog"),
                            "true_heading": pr.get("TrueHeading"),
                        }

                        # Send live data to frontend client
                        await websocket.send_json(position_data)

                except asyncio.TimeoutError:
                    break

        # Notify frontend that stream is complete
        await websocket.send_json({"status": "complete"})

    except WebSocketDisconnect:
        print("Client disconnected")

    except Exception as e:
        # Send error to frontend
        await websocket.send_json({"error": str(e)})

    finally:
        # Close WebSocket connection
        await websocket.close()

# ==========================================================
# 🔹 RUN APPLICATION
# ==========================================================

if __name__ == "__main__":

    import uvicorn

    # Start FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8000)
