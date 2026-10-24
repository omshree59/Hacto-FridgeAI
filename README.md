# FridgeFlow AI 🥦🥛
### Complete Local-First AI Fridge Scanner & Grocery List Application

> **"Your fridge. Decoded."**  
> *Snap a photo. Know what you have. Shop only what you need.*

FridgeFlow AI is a 100% private, local-first web application designed to eliminate grocery guesswork. It allows users to capture or upload refrigerator/pantry photos and runs local computer vision models (such as **Gemma 3** or **LLaVA** via Ollama) directly on their machine to detect groceries, estimate quantities, reconcile inventory without duplicate entries, and deterministically generate shopping lists based on low-stock thresholds.

**Zero cloud API calls. Zero monthly AI inference fees. No photos ever leave your personal computer.**

---

## Architecture Overview

```
                      +-----------------------------+
                      |     Next.js 16 Frontend     |
                      | (React 19, TypeScript, TW)  |
                      +--------------+--------------+
                                     |
                          REST API   |  Port 8000
                                     v
                      +-----------------------------+
                      |       FastAPI Backend       |
                      |  (Python 3.11+, SQLAlchemy) |
                      +-------+--------------+------+
                              |              |
         Pillow Preprocessing |              | HTTPX Async Engine
                              v              v
               +-------------------+  +----------------------------+
               | Local SQLite DB   |  | Local Ollama Daemon        |
               | (Persistent Data) |  | (Gemma 3 Vision / Text)   |
               +-------------------+  +----------------------------+
```

---

## 1. Prerequisites

- **Node.js**: v18.18+ or v20+ (tested on Node v22)
- **Python**: 3.11+ (tested on Python 3.13)
- **Ollama**: Locally installed (https://ollama.com)
- **RAM / Hardware Requirements**:
  - Minimum 8 GB RAM (CPU mode for 4B models)
  - Recommended: 16 GB RAM or 6 GB+ VRAM GPU for sub-5s local inference
- Operating Systems: Windows 10/11, macOS, or Linux.

---

## 2. Installing Node.js

- **Windows**: Download from [nodejs.org](https://nodejs.org/) or install via winget:
  ```powershell
  winget install OpenJS.NodeJS.LTS
  ```
- **macOS** (Homebrew):
  ```bash
  brew install node
  ```
- **Linux** (Debian/Ubuntu):
  ```bash
  sudo apt update && sudo apt install nodejs npm -y
  ```

---

## 3. Installing Python

- **Windows**: Download from [python.org](https://www.python.org/downloads/) or via winget:
  ```powershell
  winget install Python.Python.3.11
  ```
  *(Ensure you check "Add Python to PATH" during installation).*
- **macOS** (Homebrew):
  ```bash
  brew install python@3.11
  ```
- **Linux**:
  ```bash
  sudo apt install python3 python3-pip python3-venv -y
  ```

---

## 4. Installing Ollama

1. Visit [https://ollama.com/download](https://ollama.com/download).
2. Download and run the installer for Windows, macOS, or Linux.
3. Start the Ollama background service:
   ```bash
   ollama serve
   ```
4. Verify by browsing to `http://localhost:11434` or running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

---

## 5. Downloading a Compatible Gemma Vision Model

To analyze fridge photos, download a vision-capable model:

```bash
# Recommended default (Gemma 3 4B):
ollama run gemma3:4b

# Alternative high-accuracy vision models:
ollama run llama3.2-vision:11b
# Or lightweight vision model:
ollama run moondream
```

---

## 6. Downloading an Optional Text Model

For text normalization or recipe generation:

```bash
ollama run gemma3:4b
```

---

## 7. Verifying Model Availability

Check that the model is downloaded and registered:

```bash
ollama list
```
You should see `gemma3:4b` (or your configured model) listed under `NAME`.

---

## 8. Configuring Environment Variables

Copy the example environment file:

- **Windows PowerShell**:
  ```powershell
  Copy-Item .env.example .env
  ```
- **macOS / Linux**:
  ```bash
  cp .env.example .env
  ```

Default `.env` configuration:
```ini
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_VISION_MODEL=gemma3:4b
OLLAMA_TEXT_MODEL=gemma3:4b
OLLAMA_TIMEOUT_SECONDS=90.0
MAX_UPLOAD_SIZE_MB=15
AUTO_DELETE_IMAGES_AFTER_ANALYSIS=false
DEFAULT_LOW_STOCK_THRESHOLD=1.0
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 9. Creating and Activating a Python Virtual Environment

- **Windows PowerShell**:
  ```powershell
  python -m venv backend\venv
  backend\venv\Scripts\Activate.ps1
  ```
- **macOS / Linux**:
  ```bash
  python3 -m venv backend/venv
  source backend/venv/bin/activate
  ```

---

## 10. Installing Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

---

## 11. Running Database Initialization

Create all tables in SQLite:

- **Windows PowerShell**:
  ```powershell
  backend\venv\Scripts\python.exe backend\app\db\init_db.py
  ```
- **macOS / Linux**:
  ```bash
  python backend/app/db/init_db.py
  ```

---

## 12. Starting FastAPI Backend

- **Windows PowerShell**:
  ```powershell
  backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
  ```
- **macOS / Linux**:
  ```bash
  uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
  ```

Verify at `http://localhost:8000/docs` (Interactive Swagger OpenAPI Documentation).

---

## 13. Installing Frontend Dependencies

In a new terminal window:

```bash
cd frontend
npm install --legacy-peer-deps
```

---

## 14. Starting Next.js Frontend

```bash
npm run dev
```

---

## 15. Opening the Application

Open your browser to:
```
http://localhost:3000
```

- **Dashboard**: `http://localhost:3000/dashboard`
- **Scanner**: `http://localhost:3000/scan`
- **Inventory**: `http://localhost:3000/inventory`
- **Grocery List**: `http://localhost:3000/grocery-list`
- **Recipe Helper**: `http://localhost:3000/recipes`
- **History**: `http://localhost:3000/history`
- **Settings**: `http://localhost:3000/settings`

---

## 16. Running Tests

### Backend Unit & Integration Tests (17 tests)
```powershell
# From project root:
backend\venv\Scripts\python.exe -m pytest backend/tests -v
```

### Frontend Tests (5 tests)
```bash
npm --prefix frontend test
```

---

## 17. Troubleshooting Model Compatibility

If your model reports it cannot accept images:
1. Ensure your model is vision-capable (`gemma3:4b`, `llama3.2-vision`, `llava`, `moondream`). Text-only models (like `llama3:8b` or `mistral`) cannot accept image buffers.
2. In the application **Settings** (`/settings`), verify the "Vision Capable" badge indicates Verified.
3. Switch models dynamically in the Settings UI or in `.env`.

---

## 18. Troubleshooting Slow CPU Inference

If you do not have a dedicated NVIDIA or Apple Silicon GPU:
1. Ollama defaults to CPU inference with AVX2.
2. Inference may take 15–40 seconds for 4B models.
3. In `/settings` or `.env`, increase `OLLAMA_TIMEOUT_SECONDS=180`.
4. Consider using smaller models such as `moondream` (1.8B) for fast CPU scanning:
   ```bash
   ollama run moondream
   ```
   Set `OLLAMA_VISION_MODEL=moondream` in `.env`.

---

## 19. Changing Model Names

You can switch models at any time:
- In the web UI: go to **Settings** -> Change "Vision Model Name" -> Click "Save Configuration".
- Or update `.env` and restart FastAPI.

---

## 20. Backing Up and Deleting Local Data

- **Backup**: Copy `data/fridgeflow.db` and the `data/uploads/` directory to your backup drive.
- **Export**: Navigate to `/inventory` or `/settings` and click "Export CSV" or "Export Complete Inventory JSON".
- **Erase All Data**:
  - In the web UI: Go to `/settings` -> Click "Erase All Local Data".
  - Or manually delete `data/fridgeflow.db` and `data/uploads/*.jpg`.

---

## Running with Docker (Optional)

> **Important Host Networking Note**: A Docker container cannot reach host services via `localhost`. The included `docker-compose.yml` configures `host.docker.internal:11434` with `host-gateway` mapping.

```bash
docker-compose up --build
```
Access the application at `http://localhost:3000`.

---

## Master Feature Matrix

| Feature | Status | Details |
|---|---|---|
| **Local Vision AI** | Operational | Ollama vision inference with fallback parsing & JSON schema validation |
| **Zero Cloud Telemetry** | Verified | No third-party APIs; 100% private |
| **Image Preprocessing** | Operational | EXIF orientation correction, lanczos thumbnailing, RGB sanitization |
| **Detection Review** | Operational | Editable candidate list, confidence levels, high vs uncertain badges |
| **Inventory Reconciliation** | Operational | Intelligent matching preventing duplicate entries |
| **Smart Grocery List** | Operational | Aisle grouping, low-stock restock generation, Shopping Mode, CSV/TXT export |
| **Deterministic Stock Logic**| Operational | Dynamic rules for In Stock, Low Stock, Out of Stock, Unknown |
| **Recipe Helper** | Operational | Ingredient normalizer, inventory comparison, 1-click grocery queueing |
| **Scan History** | Operational | Past scans, detection drill-down, side-by-side comparison, image purge |
| **Dark / Light Theme** | Operational | Warm organic palette with Forest `#183D32`, Sage `#A8C3A0`, Cream `#F7F5EE` |
| **Automated Tests** | 22/22 Passing | 17 pytest backend tests + 5 Vitest frontend tests |
