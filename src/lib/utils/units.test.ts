import { describe, expect, it } from 'vitest'

import { convertWeight, kilogramsToPounds, poundsToKilograms } from './units'

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
})

