from pydantic import BaseModel

class ChatRequest(BaseModel):
    query: str
    user_id: int

class ChatResponse(BaseModel):
    response: str