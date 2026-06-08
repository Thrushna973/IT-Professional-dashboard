const API_URL = 'http://localhost:5000'

export const sendMessage = async (message) => {
  const response = await fetch(`${API_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'AI service error')
  }

  const data = await response.json()
  return data.reply || data.message || 'No response from AI'
}
