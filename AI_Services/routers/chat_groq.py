from fastapi import APIRouter
from pydantic import BaseModel
from services.chat_agent_groq import GroqHybridAgent

router = APIRouter(prefix="/chat-groq", tags=["Groq AI Chat"])

class ChatRequest(BaseModel):
    query: str
    user_id: int 

@router.post("/ask")
async def ask_groq(request: ChatRequest):
    agent = GroqHybridAgent()
    response = await agent.process_query(request.query, request.user_id)
    return {"response": response, "success": True}