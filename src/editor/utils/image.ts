export function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360
}

export function getRotatedRectSize(
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } {
  const radian = (rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(radian))
  const sin = Math.abs(Math.sin(radian))
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos
  }
}
