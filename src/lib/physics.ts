export const GRAVITY = {
  EARTH: 9.80665,
  MOON: 1.62,
  MARS: 3.71,
  JUPITER: 24.79,
}

export function calculatePendulumPeriod(length: number, gravity: number): number {
  if (gravity <= 0) {
    throw new Error("Gravity must be positive")
  }
  if (length < 0) {
    throw new Error("Length must be non-negative")
  }
  return 2 * Math.PI * Math.sqrt(length / gravity)
}

export function calculateFrequency(period: number): number {
  if (period === 0) return 0
  return 1 / period
}
