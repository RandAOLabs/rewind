import { Dispatch, SetStateAction } from 'react'
import './Counter.css'

interface CounterProps {
  count: number
  setCount: Dispatch<SetStateAction<number>>
}

export function Counter({ count, setCount }: CounterProps) {
  return (
    <div className="counter">
      <button onClick={() => setCount(count + 1)}>
        count is {count}
      </button>
      <p>
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
    </div>
  )
}
