import type { WeightUnit } from '../supabase/types'

export function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10
}

export function roundToTwoDecimals(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
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

export function convertWeightForStorage(value: number, fromUnit: WeightUnit, toUnit: WeightUnit) {
  if (fromUnit === toUnit) {
    return roundToTwoDecimals(value)
  }

  if (fromUnit === 'lb' && toUnit === 'kg') {
    return roundToTwoDecimals(value * 0.45359237)
  }

  return roundToTwoDecimals(value / 0.45359237)
}
