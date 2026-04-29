"""
Pure Click-Point (Single Image) authentication endpoints.
"""

import json
import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import ClickPointLoginRequest, TokenResponse, MessageResponse
from ..security import create_access_token
from ..auth_utils import hash_click_pattern, verify_dual
from ..config import settings

router = APIRouter(prefix="/api/click-point",
                   tags=["Click-Point Authentication"])


@router.post("/register", response_model=MessageResponse)
async def click_point_register(
    email: str = Form(...),
    clicks: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Register a user with Pure Click-Point method."""
    existing = db.query(User).filter(
        User.email == email,
        User.auth_method == "click_point",
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Method already registered")

    try:
        click_list = json.loads(clicks)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid clicks JSON")

    if len(click_list) < 3 or len(click_list) > 5:
        raise HTTPException(
            status_code=400, detail="Must provide 3-5 click points")

    ext = os.path.splitext(image.filename)[1] or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    content = await image.read()
    with open(filepath, "wb") as f:
        f.write(content)

    coords = [(c["x"], c["y"]) for c in click_list]
    click_hash = hash_click_pattern(coords)

    user = User(
        email=email,
        auth_method="click_point",
        image_path=filepath,
        click_hash=click_hash,
        click_data=json.dumps(coords),
        tolerance=0.05,
    )
    db.add(user)
    db.commit()

    return MessageResponse(message="Registration successful")


@router.post("/login", response_model=TokenResponse)
async def click_point_login(
    request: ClickPointLoginRequest, db: Session = Depends(get_db)
):
    """Authenticate user with click-point pattern."""
    user = db.query(User).filter(
        User.email == request.email,
        User.auth_method == "click_point",
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    input_coords = [(c.x, c.y) for c in request.clicks]
    stored_coords = json.loads(user.click_data)

    if not verify_dual(user.click_hash, stored_coords, input_coords, user.tolerance):
        raise HTTPException(status_code=401, detail="Authentication failed")

    token = create_access_token(
        data={"sub": user.email, "method": "click_point"}
    )
    return TokenResponse(
        access_token=token, email=user.email, auth_method="click_point"
    )


@router.get("/image/{email}")
async def get_user_image(email: str, db: Session = Depends(get_db)):
    """Get the image path for a Click-Point user."""
    user = db.query(User).filter(
        User.email == email,
        User.auth_method == "click_point",
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"image_url": f"/{user.image_path}"}
