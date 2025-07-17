import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics, Loading } from './shared/components'
import { createRoute } from './utils/routing'
import Home from './pages/Home/Home'
import Header from './shared/components/Header/Header'
// Create route with automatic eager loading
const History = createRoute(() => import('./pages/History/History'))
const UndernameDetail = createRoute(() => import('./pages/UndernameDetail/UndernameDetail'))

function App() {
  return (
    <BrowserRouter>
      <Analytics>
        <Header />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history/:arnsname" element={<History />} />
            <Route path="/history/:arnsname/:undername" element={<UndernameDetail />} />
          </Routes>
        </Suspense>
      </Analytics>
    </BrowserRouter>
  )
}

export default App
