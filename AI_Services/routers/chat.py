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
    Hybrid AI Chat Endpoint with SQL Query, Vector DB, and General Knowledge Support.
    
    Routes queries to:
    - SQL Database for diet/nutrition tracking questions
    - Vector DB for app navigation questions  
    - Direct LLM for general knowledge questions
    """
    try:
        agent = HybridAgent()
        
        print(f"[API] Processing query for User {request.user_id}: {request.query}")
        
        response = await agent.process_query(request.query, request.user_id)
        
        return {"response": response, "success": True}
        
    except Exception as e:
        print(f"[CRITICAL API ERROR] {str(e)}")
        return {
            "response": "I'm encountering a temporary system error. Please try again shortly.",
            "success": False
        }