FROM python:3.10-slim

RUN apt-get update && apt-get install -y build-essential git && rm -rf /var/lib/apt/lists/*

# Install CPU PyTorch first to prevent memory crashes
RUN pip install --no-cache-dir torch==2.3.1+cpu --index-url https://download.pytorch.org/whl/cpu

RUN useradd -m -u 1000 appuser
WORKDIR /app

# UPDATE: Tell Docker to grab requirements from inside the backend folder
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# BULLETPROOF SPACY INSTALL: Bypasses the 404 line-ending bug
RUN pip install --no-cache-dir https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1.tar.gz

# UPDATE: Tell Docker to grab the app from inside the backend folder
COPY backend/app/ ./app/

USER appuser
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]