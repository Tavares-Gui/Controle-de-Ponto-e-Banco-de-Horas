import { useEffect, useState } from 'react'

export default function useFeedback() {
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (!feedback) return undefined
    const timeout = setTimeout(() => setFeedback(null), 4500)
    return () => clearTimeout(timeout)
  }, [feedback])

  function showSuccess(message) {
    setFeedback({ type: 'success', message })
  }

  function showError(message) {
    setFeedback({ type: 'error', message })
  }

  function clearFeedback() {
    setFeedback(null)
  }

  return { feedback, showSuccess, showError, clearFeedback }
}
