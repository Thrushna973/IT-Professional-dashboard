import React, { useEffect, useMemo, useRef, useState } from 'react'
import { sendMessage } from '../services/aiService.js'
import './AIChat.css'

const QUICK_ACTIONS = [
  { label: 'Latest Tech News', value: 'Show me the latest tech news.' },
  { label: 'Weather', value: 'What is the weather forecast for today?' },
  { label: 'GitHub Activity', value: 'Give me an update on my GitHub activity.' },
  { label: 'My Tasks', value: 'Show me my current tasks.' },
  { label: 'System Status', value: 'Tell me the current system status.' }
]

const initialMessages = [
  {
    id: 'ai-1',
    sender: 'ai',
    text: 'Hello! I am your AI assistant. How can I help you today?'
  }
]

const AIChat = ({ onClose = () => {} }) => {
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [apiError, setApiError] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message])
  }

  const handleAiResponse = async (prompt) => {
    setIsSending(true)
    setApiError('')

    try {
      const reply = await sendMessage(prompt)
      addMessage({
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply
      })
    } catch (error) {
      console.error('AI chat error:', error)
      const fallback = 'Sorry, I could not reach the AI service. Please try again later.'
      setApiError(fallback)
      addMessage({
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: fallback
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isSending) {
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed
    }

    addMessage(userMessage)
    setInputValue('')
    handleAiResponse(trimmed)
  }

  const handleQuickAction = (value) => {
    if (isSending) {
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: value
    }

    addMessage(userMessage)
    handleAiResponse(value)
  }

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSend()
    }
  }

  const statusText = useMemo(() => {
    if (isSending) return 'AI is typing...'
    if (apiError) return 'Connection issue. Please try again.'
    return 'Ready to assist you'
  }, [isSending, apiError])

  return (
    <section className="ai-chat-panel">
      <header className="ai-chat-header">
        <div>
          <p className="ai-chat-title">AI Assistant</p>
          <div className="ai-chat-status">
            <span className="ai-status-dot" />
            <span>{statusText}</span>
          </div>
        </div>
        <button className="ai-chat-close" type="button" onClick={onClose} aria-label="Close AI assistant">
          ×
        </button>
      </header>

      <div className="ai-chat-messages" role="log" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ai-chat-message ai-chat-message--${message.sender}`}
          >
            <div className="ai-chat-bubble">
              <p>{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-actions">
        <p className="ai-actions-label">Quick Actions</p>
        <div className="ai-actions-list">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              className="ai-action-button"
              onClick={() => handleQuickAction(action.value)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ai-chat-input-area">
        <textarea
          className="ai-chat-input"
          rows="2"
          placeholder="Ask the assistant anything..."
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button className="ai-chat-send" type="button" onClick={handleSend} disabled={isSending}>
          Send
        </button>
      </div>
    </section>
  )
}

export default AIChat
