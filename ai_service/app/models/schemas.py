from pydantic import BaseModel
from typing import Optional

class RegistrationData(BaseModel):
    name: str
    phone: str
    email: str
    college: str

class DuplicateCheckData(BaseModel):
    name: str
    email: str
    eventId: int

class ChatMessage(BaseModel):
    message: str
    history: Optional[list] = []
