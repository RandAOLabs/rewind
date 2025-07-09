import { IRouteManager, RouteConfig } from './types'

class RouteManager implements IRouteManager {
  private static instance: RouteManager
  private routes: Map<string, RouteConfig> = new Map()

  private constructor() {}

  static getInstance(): RouteManager {
    if (!RouteManager.instance) {
      RouteManager.instance = new RouteManager()
    }
    return RouteManager.instance
  }

  registerRoute(config: RouteConfig): void {
    this.routes.set(config.path, config)
    if (config.preload) {
      this.preloadRoute(config.path)
    }
  }

  getRoutes(): RouteConfig[] {
    return Array.from(this.routes.values())
  }

  async preloadRoute(path: string): Promise<void> {
    const route = this.routes.get(path)
    if (route) {
      try {
        await route.component()
      } catch (error) {
        console.error(`Failed to preload route: ${path}`, error)
      }
    }
  }

  async preloadAll(): Promise<void> {
    const preloadPromises = Array.from(this.routes.values())
      .filter(route => route.preload)
      .map(route => this.preloadRoute(route.path))
    
    await Promise.all(preloadPromises)
  }
}

export const routeManager = RouteManager.getInstance()
