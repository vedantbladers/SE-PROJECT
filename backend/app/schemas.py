from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime


# ---- Shared ----

class ClickPoint(BaseModel):
    x: float = Field(..., ge=0, le=1, description="Normalized X coordinate (0-1)")
    y: float = Field(..., ge=0, le=1, description="Normalized Y coordinate (0-1)")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    auth_method: str


class UserResponse(BaseModel):
    id: int
    email: str
    auth_method: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str


# ---- CCP ----

class CCPLoginRequest(BaseModel):
    email: str = Field(..., min_length=5)
    clicks: List[ClickPoint]


# ---- PassFaces ----

class PassFacesRegisterRequest(BaseModel):
    email: str = Field(..., min_length=5)
    selected_face_ids: List[int] = Field(..., min_length=4, max_length=6)


class PassFacesChallengeRound(BaseModel):
    round_number: int
    images: List[dict]  # [{id, url}]


class PassFacesChallengeResponse(BaseModel):
    email: str
    rounds: List[PassFacesChallengeRound]


class PassFacesLoginRequest(BaseModel):
    email: str
    round_selections: List[int]  # IDs selected per round


# ---- Grid Draw ----

class GridDrawLoginRequest(BaseModel):
    email: str
    pattern: List[int]


# ---- Click-Point (Pure) ----

class ClickPointLoginRequest(BaseModel):
    email: str
    clicks: List[ClickPoint]
