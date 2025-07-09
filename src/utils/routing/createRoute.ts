import { lazy } from 'react'

export function createRoute(importPath: () => Promise<any>) {
  // Start loading immediately
  const modulePromise = importPath()
  // Return lazy component that uses the same promise
  return lazy(() => modulePromise)
}
