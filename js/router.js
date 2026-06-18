/**
 * Simple client-side router for SPA navigation
 */
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    window.addEventListener('popstate', () => this.resolve());
  }

  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  navigate(path, params = {}) {
    const url = new URL(window.location);
    url.hash = path;
    
    // Store params in sessionStorage for the route
    if (Object.keys(params).length > 0) {
      sessionStorage.setItem('route_params', JSON.stringify(params));
    }
    
    window.history.pushState(params, '', url);
    this.resolve();
  }

  getParams() {
    const stored = sessionStorage.getItem('route_params');
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    const route = this.routes[hash];
    
    if (route) {
      this.currentRoute = hash;
      route(this.getParams());
    } else {
      // Fallback to home
      const home = this.routes['/'];
      if (home) {
        this.currentRoute = '/';
        home();
      }
    }
  }

  getCurrentRoute() {
    return this.currentRoute || window.location.hash.slice(1) || '/';
  }
}

export const router = new Router();
