from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import chat, chat_doctor_groq, chat_groq, nutrition, vision_nutrition

app = FastAPI(
    title=settings.PROJECT_NAME, 
    version=settings.VERSION,
    docs_url="/ai/docs",          
    openapi_url="/ai/openapi.json", 
    redoc_url="/ai/redoc"         
)

# CORS Middleware (Allowing Django to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          # Your local React server
        "http://localhost:8080",          # Your local Docker setup
        "https://my-calo-ai.vercel.app"   # EXACT Vercel URL (No trailing slash)
    ], # In production, change this to your Django URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(nutrition.router, prefix="/ai")
app.include_router(vision_nutrition.router, prefix="/ai")
app.include_router(chat.router, prefix="/ai")
app.include_router(chat_groq.router, prefix="/ai")
app.include_router(chat_doctor_groq.router, prefix="/ai")

# Health check at the root of the /ai prefix
@app.get("/ai")
def health_check():
    return {"status": "ok", "service": "AI_Services"}

# Test CI/CD trigger.