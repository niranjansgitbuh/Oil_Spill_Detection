import streamlit as st
import numpy as np
import cv2
import tensorflow as tf
import matplotlib.pyplot as plt
from tensorflow.keras.layers import Conv2DTranspose
import os
import asyncio
import websockets
import json
from datetime import datetime, timezone
import time
import pandas as pd
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_alert_email(sender_email, sender_password, receiver_email, area_percent):
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
        st.error(f"❌ Failed to send email: {e}")
        return False


# --- Monkey patch for backward compatibility ---
old_from_config = Conv2DTranspose.from_config
def new_from_config(config):
    config.pop("groups", None)
    return old_from_config(config)
Conv2DTranspose.from_config = staticmethod(new_from_config)

# --- Page configuration ---
st.set_page_config(
    page_title="Oil Spill Detection & AIS Tracking",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Sidebar Navigation ---
st.sidebar.title("Navigation")
page = st.sidebar.radio("Go to:", ["Home", "Oil Spill Detection", "AIS Ship Tracking"])

# --- Load Model ---
MODEL_PATH = r"Models\oilspill_unet.h5"
AIS_API_KEY = "98cd3429a4ef059a71e248835cbaf9719274a967"

@st.cache_resource
def load_unet_model():
    return tf.keras.models.load_model(MODEL_PATH, compile=False)

model = load_unet_model()

# --- Prediction Function ---
def predict_image(image):
    img_resized = cv2.resize(image, (256, 256))
    input_img = np.expand_dims(img_resized, axis=0) / 255.0
    pred_mask = model.predict(input_img)[0, ..., 0]
    binary_mask = (pred_mask > 0.5).astype(np.uint8)
    area_percent = (np.sum(binary_mask) / binary_mask.size) * 100
    label = f"Prediction: {'Potential Oil Spill' if area_percent > 0.5 else 'No Oil Spill'} ({area_percent:.2f}% area)"

    mask_resized = cv2.resize(binary_mask, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST)
    overlay = image.copy()
    overlay[mask_resized == 1] = [255, 0, 0]
    return label, overlay


# --- HOME PAGE ---
if page == "Home":
    st.markdown("<h1 style='text-align:center;'>Marine Oil Spill Detection & Monitoring System</h1>", unsafe_allow_html=True)
    logo_path = os.path.join(os.path.dirname(__file__), "Screenshot 2025-10-07 224358.png")
    _c1, _c2, _c3 = st.columns([1, 1, 1])
    with _c2:
        st.image(logo_path, width=160)


    st.markdown("""
    ## 🌍 The Problem: Rising Threats to Our Oceans
    Oil spills are one of the most **severe environmental disasters**, releasing thousands of tons of crude oil into our oceans every year.  
    These spills not only **pollute marine ecosystems**, but also destroy coral reefs, threaten aquatic life, and damage coastal livelihoods.  
    According to the **International Tanker Owners Pollution Federation (ITOPF)**, over **7,000 tonnes of oil** are spilled annually, 
    with **devastating long-term effects** on biodiversity and water quality.  

    Traditionally, identifying oil spills from satellite images requires **manual inspection** by trained analysts.  
    This process is **slow, error-prone, and costly**, often causing delays in emergency response when every minute matters.

    ---

    ## 💡 Our Solution: AI-Powered Oil Spill Detection
    To address this issue, we have built an **AI-driven system** that automatically detects oil spills from **Sentinel-1 SAR satellite images**.  
    The system uses a **Convolutional Neural Network (CNN)-based U-Net model** trained to distinguish oil spills from ocean surfaces 
    based on radar backscatter patterns.

    Once the image is analyzed, the system:
    - **Highlights the affected regions** using an overlay mask.  
    - **Estimates the percentage of the area** covered by oil.  
    - **Generates alerts** if a potential spill is detected.  
    - Optionally, it can integrate with **AIS (Automatic Identification System)** data to track nearby vessels and identify possible sources.

    ---

    ## ⚙️ How It Works
    1. **Upload an Image:** The user uploads a Sentinel-1 or any satellite image of a marine area.  
    2. **AI Analysis:** The trained deep learning model processes the image to detect potential oil spills.  
    3. **Visualization:** The detected spill regions are highlighted in red on the image for easy interpretation.  
    4. **AIS Integration:** Live ship-tracking data from AIS APIs is displayed to monitor vessel activity in the affected area.  
    5. **Alert System:** In case of detected spills, automated email notifications can be sent to the authorities for further investigation.

    ---

    ## 🌐 Why This Matters
    This project demonstrates how **AI and satellite data** can be combined to improve **marine environmental monitoring**.  
    It enables:
    - **Faster response times** during oil spill incidents.  
    - **Accurate detection and source tracing** using ship movement data.  
    - **Reduced manual effort** for large-scale image analysis.  
    - **Sustainable protection of marine resources** through early intervention.

    ---

    ### 🚀 Technology Stack
    - **Deep Learning Framework:** TensorFlow / Keras  
    - **Image Processing:** OpenCV  
    - **Frontend Framework:** Streamlit  
    - **Satellite Data Source:** Copernicus Sentinel-1 (SAR Images)  
    - **Ship Tracking Integration:** AIS APIs (e.g., AISstream.io)  

    ---
    """)


# --- OIL SPILL DETECTION PAGE ---
elif page == "Oil Spill Detection":
    st.header("Oil Spill Detection from Satellite Images")
    st.write("Upload a satellite image (e.g., Sentinel-1) and the AI will detect potential oil spills.")

    uploaded_file = st.file_uploader("Upload an image", type=["jpg", "png", "jpeg"])
    
    if uploaded_file:
        file_bytes = np.asarray(bytearray(uploaded_file.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, 1)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        label, overlay = predict_image(img)

        st.subheader("Detection Result")
        fig, ax = plt.subplots()
        ax.imshow(overlay)
        ax.set_title(label, fontsize=12, color="lime")
        ax.axis("off")
        st.pyplot(fig)

        st.success("✅ Analysis complete! The red regions highlight potential oil spills.")
                # --- Email Alert System ---
        if (("Potential Oil Spill" in label) and (float(label.split('(')[1].split('%')[0]) > 0.7)):
            st.warning("⚠️ Significant oil spill detected! You can send an alert email to authorities.")

            with st.expander("📧 Send Alert Email"):
                user_email = st.text_input("Enter your email address")
                user_password = st.text_input("Enter your email password (App Password recommended)", type="password")
                recipient_email = st.text_input("Enter recipient email (Authority/Checker)")
                message_body = f"""
                Subject: ⚠️ Oil Spill Alert Detected

                A potential oil spill has been detected.

                Details:
                - Area affected: {label.split('(')[1].split(')')[0]}
                - Please check the monitoring dashboard for more details.

                Sent automatically by the Marine Oil Spill Detection System.
                """

                if st.button("🚨 Send Alert Email"):
                    if user_email and user_password and recipient_email:
                        import smtplib
                        try:
                            server = smtplib.SMTP("smtp.gmail.com", 587)
                            server.starttls()
                            server.login(user_email, user_password)
                            server.sendmail(user_email, recipient_email, message_body)
                            server.quit()
                            st.success("✅ Alert email sent successfully!")
                        except Exception as e:
                            st.error(f"❌ Failed to send email: {e}")
                    else:
                        st.error("⚠️ Please fill in all fields before sending the email.")
    else:
        st.info("📤 Please upload an image to begin analysis.")


# --- AIS SHIP TRACKING PAGE ---
# --- AIS SHIP TRACKING PAGE ---
elif page == "AIS Ship Tracking":
    st.header("Live AIS Ship Tracking")
    st.write("Connect to AISstream.io using your API key and visualize live ship positions.")

    with st.expander("Connection Settings", expanded=True):
        st.info("API key is pre-configured.")
        col1, col2 = st.columns(2)
        st.subheader("🌍 Define Region of Interest (European Waters)")

        # --- Latitude Row ---
        col1, col2 = st.columns(2)
        with col1:
            min_lat = st.number_input("Min Latitude", value=34.0, min_value=-90.0, max_value=90.0)
        with col2:
            max_lat = st.number_input("Max Latitude", value=71.0, min_value=-90.0, max_value=90.0)

        # --- Longitude Row ---
        col3, col4 = st.columns(2)
        with col3:
            min_lon = st.number_input("Min Longitude", value=-25.0, min_value=-180.0, max_value=180.0)
        with col4:
            max_lon = st.number_input("Max Longitude", value=45.0, min_value=-180.0, max_value=180.0)

        mmsi_csv = st.text_input("Filter MMSI (comma-separated, optional)")
        duration_sec = st.slider("Stream duration (seconds)", min_value=5, max_value=60, value=15)

    # --- Stream AIS positions (async) ---
    async def stream_ais_positions(api_key_value, bbox, mmsi_list, duration_seconds):
        uri = "wss://stream.aisstream.io/v0/stream"
        subscribe_message = {"APIKey": api_key_value, "BoundingBoxes": [bbox]}
        if mmsi_list:
            subscribe_message["FiltersShipMMSI"] = mmsi_list
        subscribe_message["FilterMessageTypes"] = ["PositionReport"]

        positions = []
        start_time = time.time()
        async with websockets.connect(uri) as websocket:
            await websocket.send(json.dumps(subscribe_message))
            while time.time() - start_time < duration_seconds:
                try:
                    message_json = await asyncio.wait_for(websocket.recv(), timeout=duration_seconds)
                except asyncio.TimeoutError:
                    break
                message = json.loads(message_json)
                if message.get("MessageType") == "PositionReport":
                    pr = message["Message"]["PositionReport"]
                    positions.append({
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "mmsi": pr.get("UserID"),
                        "lat": pr.get("Latitude"),
                        "lon": pr.get("Longitude"),
                        "sog": pr.get("Sog"),  # Speed over ground
                        "cog": pr.get("Cog"),
                        "true_heading": pr.get("TrueHeading"),
                    })
        return positions

    bbox = [[min_lat, min_lon], [max_lat, max_lon]]
    mmsi_list = [m.strip() for m in mmsi_csv.split(",") if m.strip()] if mmsi_csv else []

    run = st.button("Start Stream")
    if run:
        with st.spinner("Connecting to AIS stream and collecting data..."):
            try:
                data = asyncio.run(stream_ais_positions(AIS_API_KEY, bbox, mmsi_list, duration_sec))
            except Exception as e:
                st.error(f"Failed to stream AIS data: {e}")
                data = []

            if not data:
                st.warning("No position reports received in the selected duration.")
            else:
                df = pd.DataFrame(data)
                df_latest = df.sort_values("timestamp").dropna(subset=["lat", "lon"]).drop_duplicates(subset=["mmsi"], keep="last")

                st.subheader("Latest Ship Positions")
                st.dataframe(df_latest[["mmsi", "lat", "lon", "sog", "cog", "true_heading", "timestamp"]], use_container_width=True)

                # --- Use PyDeck for interactive map with color coding ---
                import pydeck as pdk

                # Define colors: green for fast (>10 knots), red for slow
                df_latest["color"] = df_latest["sog"].apply(lambda x: [0, 255, 0] if x > 10 else [255, 0, 0])

                # Create PyDeck layer
                layer = pdk.Layer(
                    "ScatterplotLayer",
                    data=df_latest,
                    get_position=["lon", "lat"],
                    get_fill_color="color",
                    get_radius=5000,
                    pickable=True,
                    auto_highlight=True
                )

                # Tooltip to show ship details
                tooltip = {
                    "html": "<b>MMSI:</b> {mmsi} <br/>"
                            "<b>Speed:</b> {sog} knots<br/>"
                            "<b>Course:</b> {cog}°<br/>"
                            "<b>Heading:</b> {true_heading}°<br/>"
                            "<b>Timestamp:</b> {timestamp}",
                    "style": {"color": "white"}
                }

                view_state = pdk.ViewState(
                    latitude=(min_lat + max_lat)/2,
                    longitude=(min_lon + max_lon)/2,
                    zoom=4,
                    pitch=0
                )

                r = pdk.Deck(layers=[layer], initial_view_state=view_state, tooltip=tooltip)
                st.pydeck_chart(r)


# --- Footer ---
st.markdown("""
---
<p style="text-align:center; color:gray;">
Developed by <b>Kshitij Dasare</b> | Final Year Project 2025 | Powered by Streamlit 🌐
</p>
""", unsafe_allow_html=True)
