import { useEffect, useMemo } from 'react'
import { RouteConfig } from './types'
import { routeManager } from './RouteManager'

export function useRoutes(routes: RouteConfig[]) {
  useEffect(() => {
    // Register all routes
    routes.forEach(route => routeManager.registerRoute(route))
    
    // Preload routes marked for preloading
    routeManager.preloadAll()
  }, [routes])

  // Return memoized routes for React Router
  return useMemo(() => routeManager.getRoutes(), [])
}
