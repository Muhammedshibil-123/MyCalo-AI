from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import nutrition, vision_nutrition, chat

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# CORS Middleware (Allowing Django to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to your Django URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(nutrition.router)
app.include_router(vision_nutrition.router)
app.include_router(chat.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "AI_Services"}
