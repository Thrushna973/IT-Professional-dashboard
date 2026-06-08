import axios from 'axios'


const API_URL = 'http://localhost:5000'

export const sendMessage = async (message) => {
  const response = await axios.post(`${API_URL}/ai/chat`, {
    message
  })

  return response.data.reply
}

export async function generateResponse(prompt) {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.choices[0].message.content
  } catch (error) {
    console.error(error.response?.data || error.message)
    throw error
  }
}