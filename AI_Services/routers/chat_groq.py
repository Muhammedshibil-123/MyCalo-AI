from fastapi import APIRouter
from pydantic import BaseModel
from services.chat_agent_groq import GroqHybridAgent
from services.dynamodb_service import save_ai_chat_message, get_ai_chat_history

router = APIRouter(prefix="/chat-groq", tags=["Groq AI Chat"])

class ChatRequest(BaseModel):
    query: str
    user_id: int 

@router.get("/history/{user_id}")
async def fetch_history(user_id: int):
    history = get_ai_chat_history(user_id)
    return {"history": history, "success": True}

@router.post("/ask")
async def ask_groq(request: ChatRequest):
    
    save_ai_chat_message(request.user_id, request.query, "user")
    
    
    agent = GroqHybridAgent()
    response = await agent.process_query(request.query, request.user_id)
    
    
    save_ai_chat_message(request.user_id, response, "ai")
    
    return {"response": response, "success": True}
