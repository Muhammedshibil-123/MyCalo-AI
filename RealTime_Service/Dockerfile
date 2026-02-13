FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN pip install --upgrade pip
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Daphne handles both HTTP and WebSockets
CMD ["daphne", "-b", "0.0.0.0", "-p", "8003", "config.asgi:application"]