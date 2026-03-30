---
title: WriteRight NLP Backend
sdk: docker
app_port: 7860
---


# WriteRight NLP API 🚀

WriteRight is a production-grade NLP auto-correction and text refinement backend. It utilizes a multi-stage pipeline combining algorithmic rules with state-of-the-art Transformer models to provide instant spelling, grammar, and stylistic corrections.

## 🧠 Architecture & Models

The backend utilizes a decoupled architecture to ensure high precision:

1. **Tokenization & NER:** `spaCy (en_core_web_sm)`
2. **Spell Correction:** `SymSpell` (O(1) lookup, edit distance 1-2)
3. **Homophone Resolution:** Context-aware POS heuristics
4. **Grammar Correction:** `vennify/t5-base-grammar-correction` (T5 Encoder-Decoder)
5. **Stylistic Refinement:** `eugenesiow/bart-paraphrase` (BART Sequence-to-Sequence)

By separating **Grammar Correction** (T5) from **Stylistic Refinement** (BART), the system prevents prompt-leakage and maintains semantic integrity during paraphrasing.

## 🔌 API Endpoints

The API is built with **FastAPI** and is fully documented. Once running, visit `/docs` for the interactive Swagger UI.

### 1. Correct Text (`POST /api/correct`)
Executes the primary multi-stage correction pipeline.

**Request:**
\`\`\`json
{
  "text": "Thier going to the store to much.",
  "run_spell": true,
  "run_grammar": true,
  "run_homophones": true
}
\`\`\`

**Response:**
\`\`\`json
{
  "original": "Thier going to the store to much.",
  "corrected": "They're going to the store too much.",
  "spell_fixed": 0,
  "grammar_fixed": 1,
  "homophone_fixed": 2,
  "confidence": 0.89,
  "diffs": [...],
  "processing_ms": 345.2
}
\`\`\`

### 2. Refine Text (`POST /api/refine`)
Paraphrases and refines text for flow and style using the BART model.

**Request:**
\`\`\`json
{
  "text": "They're going to the store too much.",
  "style": "professional"
}
\`\`\`

## 🛠️ Local Setup & Development

**Prerequisites:** Python 3.9+

1. **Install dependencies:**
   \`\`\`bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   \`\`\`

2. **Run the server:**
   \`\`\`bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   \`\`\`

## ☁️ Hugging Face Deployment

This repository is configured for automatic deployment on Hugging Face Spaces via Docker. 

* **Port Mapping:** The Dockerfile routes Uvicorn to `7860` as required by HF Spaces.
* **Cold Starts:** Upon the very first container initialization, the system will download the T5 and BART model weights (~1.5GB) from the Hugging Face Hub. Initial boot may take 2-3 minutes. Subsequent requests will be processed in-memory.

---
