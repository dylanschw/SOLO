import type { WeightUnit } from '../supabase/types'

export function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10
}

export function poundsToKilograms(pounds: number) {
  return roundToOneDecimal(pounds * 0.45359237)
}

export function kilogramsToPounds(kilograms: number) {
  return roundToOneDecimal(kilograms / 0.45359237)
}

export function convertWeight(value: number, fromUnit: WeightUnit, toUnit: WeightUnit) {
  if (fromUnit === toUnit) {
    return roundToOneDecimal(value)
  }

  if (fromUnit === 'lb' && toUnit === 'kg') {
    return poundsToKilograms(value)
  }

  return kilogramsToPounds(value)
}