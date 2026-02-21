from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from services.chat_agent_doctor_groq import DoctorGroqAgent
from dependencies import verify_token 

router = APIRouter(prefix="/chat-groq", tags=["Doctor AI Chat"])

class DoctorChatRequest(BaseModel):
    query: str
    user_id: int  

@router.post("/ask_doc")
async def ask_doctor_agent(request: DoctorChatRequest, token_payload: dict = Depends(verify_token)):
    
    doctor_id = token_payload.get("user_id")
    if not doctor_id:
        raise HTTPException(status_code=401, detail="Doctor authentication failed")

    
    agent = DoctorGroqAgent()
    
    
    
    response = await agent.process_query(request.query, request.user_id)
    
    
    return {
        "response": response, 
        "doctor_id": doctor_id,
        "patient_id": request.user_id,
        "success": True
    }
