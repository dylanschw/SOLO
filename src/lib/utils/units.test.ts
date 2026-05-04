import { describe, expect, it } from 'vitest'

import { convertWeight, convertWeightForStorage, kilogramsToPounds, poundsToKilograms } from './units'

describe('weight unit utilities', () => {
  it('converts pounds to kilograms with one decimal place', () => {
    expect(poundsToKilograms(185)).toBe(83.9)
  })

  it('converts kilograms to pounds with one decimal place', () => {
    expect(kilogramsToPounds(100)).toBe(220.5)
  })

  it('returns rounded weight when units match', () => {
    expect(convertWeight(180.04, 'lb', 'lb')).toBe(180)
  })

  it('keeps enough precision for stored weights to round-trip for display', () => {
    const storedWeightKg = convertWeightForStorage(195, 'lb', 'kg')

    expect(storedWeightKg).toBe(88.45)
    expect(convertWeight(storedWeightKg, 'kg', 'lb')).toBe(195)
  })
})

