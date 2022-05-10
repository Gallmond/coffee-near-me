
/**
 * True when a given string is not empty.
 * 
 * @param value A string or number
 * @returns boolean
 */
const text = (value: string): boolean => {
  return value.toString().trim().length > 0;
}

/**
 * True when a given number is not empty, and above 0.
 * 
 * @param value A number
 * @returns boolean
 */
const floatOverZero = (value: number): boolean => {
  return typeof value === 'number' && value > 0;
}

export default {
  text,
  floatOverZero
}