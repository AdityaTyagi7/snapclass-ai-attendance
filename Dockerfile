# Python 3.11 slim Debian image
FROM python:3.11-slim

# Install system build dependencies for dlib, librosa, soundfile, and OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app


# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download resemblyzer pretrained model so it's baked into the image
# (avoids runtime download on first request which causes timeout on Render free tier)
RUN python -c "from resemblyzer import VoiceEncoder; VoiceEncoder(); print('resemblyzer model downloaded OK')"

# Copy backend source code
COPY src/ ./src/
COPY schema.sql .
COPY server.py .

# Environment defaults
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
# Tell torch to use CPU only (no CUDA on Render free tier)
ENV CUDA_VISIBLE_DEVICES=""

# Expose port
EXPOSE 8000

# Start FastAPI server
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
