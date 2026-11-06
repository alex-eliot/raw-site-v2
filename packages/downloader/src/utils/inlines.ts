export function assertReturn<T = any>(property: T | undefined, errMsg: string, beforeThrow?: () => any): T {
  if (typeof property === 'undefined') {
    beforeThrow?.call(null)
    throw new Error(errMsg)
  }

  return property
}

export function getStandardStates() {
  return [
    { name: 'Getting API data.', percentage: 0 },
    { name: 'Downloading & Processing the Images...', percentage: 0 },
  ]
}
