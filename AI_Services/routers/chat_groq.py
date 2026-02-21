from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from dependencies import verify_token
from services.chat_agent_groq import GroqHybridAgent
from services.dynamodb_service import get_ai_chat_history, save_ai_chat_message

router = APIRouter(prefix="/chat-groq", tags=["Groq AI Chat"])


class ChatRequest(BaseModel):
    query: str


@router.get("/history")
async def fetch_history(token_payload: dict = Depends(verify_token)):
    user_id = token_payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User identification failed")

    history = get_ai_chat_history(user_id)
    return {"history": history, "success": True}


@router.post("/ask")
async def ask_groq(request: ChatRequest, token_payload: dict = Depends(verify_token)):
    user_id = token_payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User identification failed")

    save_ai_chat_message(user_id, request.query, "user")

    agent = GroqHybridAgent()
    response = await agent.process_query(request.query, user_id)

    save_ai_chat_message(user_id, response, "ai")

    return {"response": response, "success": True}
