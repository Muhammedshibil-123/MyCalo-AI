from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.chat_agent import HybridAgent

router = APIRouter(prefix="/chat", tags=["AI Chat"])

class ChatRequest(BaseModel):
    query: str
    user_id: int  # In production, you would extract this from the JWT token

@router.post("/ask")
async def ask_assistant(request: ChatRequest):
    """
    Hybrid RAG Chat Endpoint.
    - Routes to SQL for personal data (weight, logs, etc.).
    - Routes to VectorDB for app help (how to change password, etc.).
    - Uses LLM for general chat.
    """
    try:
        # Initialize the agent
        agent = HybridAgent()
        
        # Process the query using the logic defined in services/chat_agent.py
        response = await agent.process_query(request.query, request.user_id)
        
        return {"response": response}
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Service Error: {str(e)}")