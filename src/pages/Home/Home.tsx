import { useState } from 'react'
import { Counter, LogoLink } from '../../shared/components'
import './Home.css'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <div className="home">
      <div className="logo-container">
        <LogoLink
          href="https://ar.io"
          src="/ario_black.png"
          alt="AR.IO Logo"
        />
        <LogoLink
          href="https://react.dev"
          src="/react.svg"
          alt="React Logo"
        />
      </div>
      <h1>AR.IO + React</h1>
      <Counter count={count} setCount={setCount} />
    </div>
  )
}

export default Home
