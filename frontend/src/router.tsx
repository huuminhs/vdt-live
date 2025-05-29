import { createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Navbar1 } from './components/navbar1'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { CreateStreamPage } from './pages/CreateStreamPage'
import { useAuthStore } from './stores/authStore'
import { StreamsPage } from './pages/StreamsPage'
import TestPage from './pages/TestPage'

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

// Home route - StreamsPage at root
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <StreamsPage />
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

// Auth parent route - redirect to home if already authenticated
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: () => (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
})

// Login route
const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/login',
  component: () => <LoginPage />
})

// Register route
const registerRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/register',
  component: () => <RegisterPage />
})

// Create stream route - requires authentication
const createStreamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stream/create',
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: () => <CreateStreamPage />
})

const testRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/test',
  component: TestPage
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  testRoute,
  productsRoute,
  pricingRoute,
  createStreamRoute,
  authRoute.addChildren([
    loginRoute,
    registerRoute
  ])
])

// Create the router
export const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
