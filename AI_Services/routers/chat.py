from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.chat_agent import HybridAgent

router = APIRouter(prefix="/chat", tags=["AI Chat"])

class ChatRequest(BaseModel):
    query: str
    user_id: int 

@router.post("/ask")
async def ask_assistant(request: ChatRequest):
    """
    Hybrid RAG Chat Endpoint with Failover.
    """
    try:
        # The agent now handles its own initialization and failover loops
        agent = HybridAgent()
        
        print(f"[API] Processing query for User {request.user_id}: {request.query}")
        
        response = await agent.process_query(request.query, request.user_id)
        
        return {"response": response}
        
    except Exception as e:
        print(f"[CRITICAL API ERROR] {str(e)}")
        # Return a soft error to the frontend instead of 500 crash
        return {
            "response": "I'm encountering a temporary system error. Please try again shortly."
        }