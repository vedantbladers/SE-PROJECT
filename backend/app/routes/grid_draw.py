"""
Grid Draw (Pattern-Based) authentication endpoints.
"""

import json
import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import GridDrawLoginRequest, TokenResponse, MessageResponse
from ..security import create_access_token
from ..auth_utils import hash_grid_pattern, verify_grid_pattern
from ..config import settings

router = APIRouter(prefix="/api/grid-draw", tags=["Grid Draw Authentication"])


@router.post("/register", response_model=MessageResponse)
async def grid_draw_register(
    email: str = Form(...),
    pattern: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Register a user with Grid Draw pattern."""
    existing = db.query(User).filter(
        User.email == email,
        User.auth_method == "grid_draw",
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Method already registered")

    try:
        pattern_list = json.loads(pattern)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid pattern JSON")

    if len(pattern_list) < 4:
        raise HTTPException(
            status_code=400, detail="Pattern must have at least 4 nodes")

    ext = os.path.splitext(image.filename)[1] or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    content = await image.read()
    with open(filepath, "wb") as f:
        f.write(content)

    p_hash = hash_grid_pattern(pattern_list)

    user = User(
        email=email,
        auth_method="grid_draw",
        image_path=filepath,
        grid_pattern=json.dumps(pattern_list),
        pattern_hash=p_hash,
    )
    db.add(user)
    db.commit()

    return MessageResponse(message="Registration successful")


@router.post("/login", response_model=TokenResponse)
async def grid_draw_login(
    request: GridDrawLoginRequest, db: Session = Depends(get_db)
):
    """Authenticate user with Grid Draw pattern."""
    user = db.query(User).filter(
        User.email == request.email,
        User.auth_method == "grid_draw",
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_grid_pattern(user.pattern_hash, request.pattern):
        raise HTTPException(status_code=401, detail="Authentication failed")

    token = create_access_token(
        data={"sub": user.email, "method": "grid_draw"}
    )
    return TokenResponse(
        access_token=token, email=user.email, auth_method="grid_draw"
    )


@router.get("/image/{email}")
async def get_user_image(email: str, db: Session = Depends(get_db)):
    """Get the image path for a Grid Draw user."""
    user = db.query(User).filter(
        User.email == email,
        User.auth_method == "grid_draw",
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"image_url": f"/{user.image_path}"}
