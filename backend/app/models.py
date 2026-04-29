from sqlalchemy import Column, Integer, String, Float, DateTime, Text, UniqueConstraint
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", "auth_method", name="uq_user_email_method"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(100), index=True, nullable=False)
    # ccp, passfaces, grid_draw, click_point
    auth_method = Column(String(20), nullable=False)

    # Image storage (used by CCP, Grid Draw, Click-Point)
    image_path = Column(String(255), nullable=True)

    # Click-based auth fields (CCP & Click-Point)
    # SHA-256 of grid-snapped coords
    click_hash = Column(Text, nullable=True)
    # JSON of normalized coords for fallback
    click_data = Column(Text, nullable=True)

    # Tolerance for Euclidean fallback (default 5%)
    tolerance = Column(Float, default=0.05)

    # PassFaces specific
    # JSON array of selected face image IDs
    passface_ids = Column(Text, nullable=True)

    # Grid Draw specific
    # JSON array of node indices
    grid_pattern = Column(Text, nullable=True)
    pattern_hash = Column(Text, nullable=True)      # SHA-256 of pattern

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', method='{self.auth_method}')>"
