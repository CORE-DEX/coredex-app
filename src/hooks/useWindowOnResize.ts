import { useEffect, useState } from 'react'
import { useWindowSize } from 'react-use'

function windowState<T>(value: T[], innerWidth: number, width: number): T {
  if (innerWidth <= width) {
    return value[0]
  } else {
    return value[1]
  }
}

/**
 * For example
 * value: [true, false]
 * width: 420
 * => (windowSize <= width): true
 */
export default function useWindowResize<T>(value: T[], width: number): T {
  const { width: innerWidth } = useWindowSize()
  const [v, setValue] = useState<T>(windowState(value, innerWidth, width))

  useEffect(() => {
    setValue(windowState(value, innerWidth, width))
  }, [value, innerWidth, width])
  return v
}
