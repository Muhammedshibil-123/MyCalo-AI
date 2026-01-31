# 1. Use an official Python runtime as a parent image
FROM python:3.12-slim

# 2. Set environment variables
# Prevents Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
# Ensures console output is flushed immediately (important for logs)
ENV PYTHONUNBUFFERED=1

# 3. Set work directory inside the container
WORKDIR /app

# 4. Install system dependencies (needed for Psycopg2/Postgres)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 5. Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# 6. Copy the rest of the application code
COPY . /app/

# 7. Expose the port Django runs on
EXPOSE 8000

# 8. Command to run the app (Development mode)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]