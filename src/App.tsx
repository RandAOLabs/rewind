import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics, Loading } from './shared/components'
import { createRoute } from './utils/routing'
import Home from './pages/Home/Home'

// Create route with automatic eager loading
const History = createRoute(() => import('./pages/History/History'))

function App() {
  return (
    <BrowserRouter>
      <Analytics>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history/:arnsname" element={<History />} />
          </Routes>
        </Suspense>
      </Analytics>
    </BrowserRouter>
  )
}

export default App
