export type WeightUnit = 'lb' | 'kg'

const poundsPerKilogram = 2.2046226218

export function poundsToKilograms(pounds: number) {
  return roundWeight(pounds / poundsPerKilogram)
}

export function kilogramsToPounds(kilograms: number) {
  return roundWeight(kilograms * poundsPerKilogram)
}

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit) {
  if (from === to) {
    return roundWeight(value)
  }

  return from === 'lb' ? poundsToKilograms(value) : kilogramsToPounds(value)
}

export function roundWeight(value: number) {
  return Math.round(value * 10) / 10
}

