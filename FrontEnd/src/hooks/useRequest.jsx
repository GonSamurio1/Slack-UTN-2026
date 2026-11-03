import { useState } from "react";

function useRequest() {
  const [loading, setIsLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)

  async function sendRequest(requestFn) {
    try {
      setIsLoading(true)
      setError(null)
      setResponse(null)
      const response = await requestFn()
      setResponse(response)
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    loading,
    response,
    error,
    sendRequest
  }
}

export default useRequest