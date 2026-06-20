2. Backend `README.md`
Place this in your `backend/` directory (or the root of your Hugging Face Space).

```markdown
# WriteRight NLP API 🧠⚙️

The core backend for **WriteRight**. This API processes text through a multi-stage Natural Language Processing pipeline to provide algorithmic spell checking, context-aware homophone resolution, structural grammar correction, and stylistic paraphrasing.

## 🏗️ Architecture & Models

The backend utilizes a decoupled architecture to ensure high precision and prevent prompt-leakage:

1. **Pre-processing & Tokenization:** `spaCy` (`en_core_web_sm`)
2. **Algorithmic Spell Correction:** `SymSpell` (O(1) dictionary lookup, edit distance 1-2)
3. **Homophone Resolution:** Context-aware regex heuristics.
4. **Grammar Correction:** `vennify/t5-base-grammar-correction` (Encoder-Decoder architecture fine-tuned specifically for grammar).
5. **Stylistic Refinement:** `eugenesiow/bart-paraphrase` (BART Sequence-to-Sequence model for native text rewrites).

## 🔌 Core API Endpoints

The API is built with **FastAPI**. Once the server is running, visit `/docs` for the interactive OpenAPI/Swagger UI.

* **`GET /api/health`**: System liveness and model loading status.
* **`GET /api/stats`**: Aggregated usage metrics (words processed, average fixes).
* **`POST /api/correct`**: Executes the primary multi-stage correction pipeline. Returns diffs, confidence scores, and fixed text.
* **`POST /api/refine`**: Paraphrases and refines text for flow and style using the BART model.

## 🛠️ Local Setup

### Prerequisites
* Python 3.9+

### Setup Instructions

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
Download the spaCy Language Model:

Bash
python -m spacy download en_core_web_sm
Run the FastAPI server:

Bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
The API will be available at http://localhost:8000.

☁️ Hugging Face Spaces Deployment
This repository is optimized for deployment via Docker on Hugging Face Spaces.

Port Mapping: The Dockerfile automatically routes Uvicorn to port 7860, which is required by Hugging Face Spaces.

Cold Starts: Upon the very first container initialization, the system will download the T5 and BART model weights (~1.5GB total) from the Hugging Face Hub. This initial boot may take 2-3 minutes. All subsequent requests are processed in-memory.

Security: Runs as a non-root user (UID 1000) in compliance with HF Spaces security policies.