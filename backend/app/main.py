"""
FastAPI application entry point.
"""

import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import User
from .security import get_current_user
from .routes import ccp, passfaces, grid_draw, click_point

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Graphical Password Authentication System",
    description="Multi-method graphical password authentication with CCP, PassFaces, Grid Draw, and Click-Point.",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist
os.makedirs("static/uploads", exist_ok=True)
os.makedirs("static/passfaces", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(ccp.router)
app.include_router(passfaces.router)
app.include_router(grid_draw.router)
app.include_router(click_point.router)


@app.get("/")
async def root():
    return {
        "message": "Graphical Password Authentication API",
        "docs": "/docs",
        "methods": ["ccp", "passfaces", "grid_draw", "click_point"],
    }


@app.get("/api/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info."""
    return {
        "email": current_user.get("sub"),
        "auth_method": current_user.get("method"),
    }


@app.get("/api/methods")
async def list_methods(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    email = current_user.get("sub")
    methods = [row[0] for row in db.query(
        User.auth_method).filter(User.email == email).all()]
    return {"email": email, "methods": methods}


@app.delete("/api/methods/{method}")
async def delete_method(
    method: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    email = current_user.get("sub")
    record = db.query(User).filter(
        User.email == email,
        User.auth_method == method,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Method not found")

    db.delete(record)
    db.commit()

    remaining = [
        row[0]
        for row in db.query(User.auth_method).filter(User.email == email).all()
    ]
    return {"deleted": method, "remaining_methods": remaining}
