import { useState } from 'react'

export const Button = () => {
  const [count, setCount] = useState(0)
  return (
    <button id="click-btn" className="shared-btn" onClick={() => setCount((c) => c + 1)}>
      Click me: {count}
    </button>
  )
}

export default Button
