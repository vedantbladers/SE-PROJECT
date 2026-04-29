"""
PassFaces (Recognition-Based) authentication endpoints.
"""

import json
import os
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import (
    PassFacesRegisterRequest,
    PassFacesLoginRequest,
    PassFacesChallengeResponse,
    PassFacesChallengeRound,
    TokenResponse,
    MessageResponse,
)
from ..security import create_access_token
from ..auth_utils import verify_passfaces
from ..config import settings

router = APIRouter(prefix="/api/passfaces", tags=["PassFaces Authentication"])


def get_face_pool() -> list:
    """Get all available face images from the passfaces directory."""
    faces_dir = settings.PASSFACES_DIR
    if not os.path.exists(faces_dir):
        return []

    files = sorted([
        f for f in os.listdir(faces_dir)
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
    ])

    return [
        {"id": i, "url": f"/{faces_dir}/{f}", "filename": f}
        for i, f in enumerate(files)
    ]


@router.get("/pool")
async def get_pool():
    """Return the full pool of available face images."""
    pool = get_face_pool()
    if not pool:
        raise HTTPException(status_code=404, detail="No face images available")
    return {"faces": pool, "total": len(pool)}


@router.post("/register", response_model=MessageResponse)
async def passfaces_register(
    request: PassFacesRegisterRequest, db: Session = Depends(get_db)
):
    """Register user with selected face images."""
    existing = db.query(User).filter(
        User.email == request.email,
        User.auth_method == "passfaces",
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Method already registered")

    pool = get_face_pool()
    pool_ids = {f["id"] for f in pool}

    for fid in request.selected_face_ids:
        if fid not in pool_ids:
            raise HTTPException(
                status_code=400, detail=f"Invalid face ID: {fid}")

    user = User(
        email=request.email,
        auth_method="passfaces",
        passface_ids=json.dumps(request.selected_face_ids),
    )
    db.add(user)
    db.commit()

    return MessageResponse(message="Registration successful")


@router.get("/challenge/{email}", response_model=PassFacesChallengeResponse)
async def get_challenge(email: str, db: Session = Depends(get_db)):
    """Generate a login challenge: 4 rounds of 9-image grids."""
    user = db.query(User).filter(
        User.email == email,
        User.auth_method == "passfaces",
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pool = get_face_pool()
    selected_ids = json.loads(user.passface_ids)

    rounds = []
    used_secret_indices = random.sample(
        range(len(selected_ids)), min(4, len(selected_ids))
    )

    for round_num, secret_idx in enumerate(used_secret_indices):
        correct_id = selected_ids[secret_idx]
        correct_face = next((f for f in pool if f["id"] == correct_id), None)
        if not correct_face:
            continue

        decoy_pool = [f for f in pool if f["id"] not in selected_ids]
        decoys = random.sample(decoy_pool, min(8, len(decoy_pool)))

        round_images = [{"id": correct_face["id"], "url": correct_face["url"]}]
        round_images.extend([{"id": d["id"], "url": d["url"]} for d in decoys])
        random.shuffle(round_images)

        rounds.append(PassFacesChallengeRound(
            round_number=round_num + 1,
            images=round_images,
        ))

    return PassFacesChallengeResponse(email=email, rounds=rounds)


@router.post("/login", response_model=TokenResponse)
async def passfaces_login(
    request: PassFacesLoginRequest, db: Session = Depends(get_db)
):
    """Verify PassFaces selections."""
    user = db.query(User).filter(
        User.email == request.email,
        User.auth_method == "passfaces",
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stored_ids = json.loads(user.passface_ids)

    for selected_id in request.round_selections:
        if selected_id not in stored_ids:
            raise HTTPException(
                status_code=401, detail="Authentication failed")

    if len(request.round_selections) != min(4, len(stored_ids)):
        raise HTTPException(status_code=401, detail="Authentication failed")

    token = create_access_token(
        data={"sub": user.email, "method": "passfaces"}
    )
    return TokenResponse(
        access_token=token, email=user.email, auth_method="passfaces"
    )
