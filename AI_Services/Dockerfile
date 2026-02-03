# Use a lightweight Python image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 8001 (Since Django uses 8000)
EXPOSE 8001

# Command to run the FastAPI server
# host 0.0.0.0 is crucial for Docker containers to talk to each other
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]