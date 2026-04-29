/**
 * Normalize pixel coordinates to [0,1] range.
 */
export function normalizeCoords(x, y, canvasWidth, canvasHeight) {
  return {
    x: Math.round((x / canvasWidth) * 1000000) / 1000000,
    y: Math.round((y / canvasHeight) * 1000000) / 1000000,
  };
}

/**
 * Convert normalized coordinates back to pixel coordinates.
 */
export function denormalizeCoords(normX, normY, canvasWidth, canvasHeight) {
  return {
    x: normX * canvasWidth,
    y: normY * canvasHeight,
  };
}
