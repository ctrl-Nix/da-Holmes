# Use official Python 3.11-slim base image
FROM python:3.11-slim

# Set environment configuration
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL="sqlite+aiosqlite:////data/holmes.db"

# Set application home directory
WORKDIR /app

# Install system utilities (essential for network diagnostics and tools like maigret)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    nmap \
    whois \
    dnsutils \
    traceroute \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt gunicorn

# Copy source code and data folders
COPY . /app/

# Expose FastAPI server port
EXPOSE 8000

# Launch FastAPI using Gunicorn with Uvicorn workers
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]
