import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Navbar1 } from './components/navbar1'
import App from './App'

// Root route with the navbar layout
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      <Navbar1/>
      <main>
        <Outlet />
      </main>
      {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
    </div>
  )
})

// Home route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <App />
})

// About route
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">About Us</h1>
      <p className="text-lg text-gray-600">
        This is the about page. Add your content here.
      </p>
    </div>
  )
})

// Products route
const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Products</h1>
      <p className="text-lg text-gray-600">
        Explore our amazing products.
      </p>
    </div>
  )
})

// Pricing route
const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pricing',
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Pricing</h1>
      <p className="text-lg text-gray-600">
        Check out our competitive pricing plans.
      </p>
    </div>
  )
})

// Blog route
const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blog',
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Blog</h1>
      <p className="text-lg text-gray-600">
        Read our latest blog posts and insights.
      </p>
    </div>
  )
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  productsRoute,
  pricingRoute,
  blogRoute
])

// Create the router
export const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
