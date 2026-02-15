import { describe, it, expect } from 'vitest'
import { calculatePendulumPeriod, calculateFrequency, GRAVITY } from '../physics'

describe('Pendulum Physics', () => {
  it('calculates period correctly on Earth', () => {
    // T = 2 * PI * sqrt(L / g)
    // L = 1m, g = 9.80665
    // T approx 2.006s
    const length = 1
    const period = calculatePendulumPeriod(length, GRAVITY.EARTH)
    expect(period).toBeCloseTo(2.006, 3)
  })

  it('calculates period correctly on Moon', () => {
    // L = 1m, g = 1.62
    // T approx 4.93s
    const length = 1
    const period = calculatePendulumPeriod(length, GRAVITY.MOON)
    expect(period).toBeCloseTo(4.937, 3)
  })

  it('calculates period for zero length', () => {
    const period = calculatePendulumPeriod(0, GRAVITY.EARTH)
    expect(period).toBe(0)
  })

  it('throws error for negative length', () => {
    expect(() => calculatePendulumPeriod(-1, GRAVITY.EARTH)).toThrow("Length must be non-negative")
  })

  it('throws error for non-positive gravity', () => {
    expect(() => calculatePendulumPeriod(1, 0)).toThrow("Gravity must be positive")
    expect(() => calculatePendulumPeriod(1, -9.8)).toThrow("Gravity must be positive")
  })

  it('calculates frequency correctly', () => {
    const period = 2
    const freq = calculateFrequency(period)
    expect(freq).toBe(0.5)
  })

  it('calculates frequency for zero period', () => {
    expect(calculateFrequency(0)).toBe(0)
  })
})
