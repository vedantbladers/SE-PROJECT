"""
Authentication utility functions:
- Coordinate normalization
- Grid-snap hashing (SHA-256, 5% grid cells → 20×20 grid)
- Euclidean distance fallback verification
- Pattern hashing for Grid Draw
- PassFaces verification
"""

import hashlib
import json
import math
from typing import List, Tuple


# ============================================================
# Coordinate Normalization
# ============================================================

def normalize_coords(
    clicks: List[dict], img_width: int, img_height: int
) -> List[Tuple[float, float]]:
    """Convert pixel coordinates to normalized [0,1] range."""
    return [
        (round(c["x"] / img_width, 6), round(c["y"] / img_height, 6))
        for c in clicks
    ]


# ============================================================
# Grid-Snap Hashing (Primary Verification)
# ============================================================

GRID_SIZE = 20  # 20×20 grid = 5% cells (1/20 = 0.05)


def grid_snap(x: float, y: float, grid_size: int = GRID_SIZE) -> Tuple[int, int]:
    """
    Snap a normalized coordinate to the nearest grid cell center.
    Returns (grid_x, grid_y) as integer indices.
    """
    gx = min(int(x * grid_size), grid_size - 1)
    gy = min(int(y * grid_size), grid_size - 1)
    return (gx, gy)


def hash_click_pattern(coords: List[Tuple[float, float]]) -> str:
    """
    Grid-snap all coordinates, then SHA-256 hash the snapped pattern.
    This is the PRIMARY verification method.
    """
    snapped = [grid_snap(x, y) for x, y in coords]
    pattern_str = json.dumps(snapped, sort_keys=True)
    return hashlib.sha256(pattern_str.encode("utf-8")).hexdigest()


# ============================================================
# Euclidean Distance (Fallback Verification)
# ============================================================

def euclidean_distance(
    p1: Tuple[float, float], p2: Tuple[float, float]
) -> float:
    """Calculate Euclidean distance between two normalized points."""
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)


def verify_click_pattern_euclidean(
    stored_coords: List[Tuple[float, float]],
    input_coords: List[Tuple[float, float]],
    tolerance: float = 0.05,
) -> bool:
    """
    Fallback verification: each input point must be within
    `tolerance` Euclidean distance of the corresponding stored point.
    """
    if len(stored_coords) != len(input_coords):
        return False

    for stored, submitted in zip(stored_coords, input_coords):
        dist = euclidean_distance(stored, submitted)
        if dist > tolerance:
            return False
    return True


# ============================================================
# Dual Verification (Primary + Fallback)
# ============================================================

def verify_dual(
    stored_hash: str,
    stored_coords: List[Tuple[float, float]],
    input_coords: List[Tuple[float, float]],
    tolerance: float = 0.05,
) -> bool:
    """
    Dual verification mechanism:
    1. PRIMARY: Compare grid-snap SHA-256 hashes for fast matching
    2. FALLBACK: If hash doesn't match, use Euclidean distance
       within tolerance for human error allowance
    """
    # Primary: hash comparison
    input_hash = hash_click_pattern(input_coords)
    if input_hash == stored_hash:
        return True

    # Fallback: Euclidean distance
    return verify_click_pattern_euclidean(stored_coords, input_coords, tolerance)


# ============================================================
# Grid Draw Pattern Hashing
# ============================================================

def hash_grid_pattern(node_sequence: List[int]) -> str:
    """Hash a grid draw pattern (sequence of node indices)."""
    pattern_str = json.dumps(node_sequence)
    return hashlib.sha256(pattern_str.encode("utf-8")).hexdigest()


def verify_grid_pattern(stored_hash: str, input_sequence: List[int]) -> bool:
    """Verify a grid draw pattern against stored hash."""
    input_hash = hash_grid_pattern(input_sequence)
    return input_hash == stored_hash


# ============================================================
# PassFaces Verification
# ============================================================

def verify_passfaces(
    stored_ids: List[int], submitted_ids: List[int]
) -> bool:
    """Verify PassFaces selections match stored IDs in order."""
    if len(stored_ids) != len(submitted_ids):
        return False
    return stored_ids == submitted_ids
