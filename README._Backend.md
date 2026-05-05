# Oil Spill Detection Backend - FastAPI

FastAPI backend server for oil spill detection using AI.

## Quick Start

### 1. Install Python
Download Python 3.8+ from [python.org](https://www.python.org/downloads/)

### 2. Open PowerShell & Navigate to Backend

```powershell
cd C:\Users\akash\work\oil_spill\Backend
```

### 3. Create & Activate Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 5. Start Server

```powershell
uvicorn main:app --reload
```

✅ Server running at: `http://localhost:8000`

---

## Access API

- **Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## Main Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/predict` | Upload image to detect oil spills |
| POST | `/api/send-alert` | Send email alert |
| WS | `/api/ais/stream` | Real-time vessel tracking |

---

## Common Issues

**Module not found error?**
```powershell
pip install -r requirements.txt
```

**Port 8000 in use?**
```powershell
uvicorn main:app --port 8001 --reload
```

**Model file missing?**
Make sure `Models/oilspill_unet.h5` exists in the Backend folder.

---

**Documentation**: See main.py for API details
