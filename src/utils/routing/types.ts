import { ComponentType } from 'react'

export interface RouteConfig {
  path: string
  component: () => Promise<{ default: ComponentType }>
  preload?: boolean
}

export interface IRouteManager {
  registerRoute(config: RouteConfig): void
  getRoutes(): RouteConfig[]
  preloadRoute(path: string): Promise<void>
  preloadAll(): Promise<void>
}
