'use client'

import { useEffect, useState } from 'react'

interface ChatAgentProps {
  apiKey: string
  onApiKeySave: (apiKey: string) => void
}

interface Message {
  sender: 'User' | 'Agent'
  text: string
}

export default function ChatAgent({ apiKey, onApiKeySave }: ChatAgentProps) {
  const [workingValue, setWorkingValue] = useState(apiKey)
  const [saved, setSaved] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [projectContext, setProjectContext] = useState('') // Can be populated from project state
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setWorkingValue(apiKey)
  }, [apiKey])

  const handleSave = () => {
    const trimmed = workingValue.trim()
    onApiKeySave(trimmed)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { sender: 'User', text: input }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, context: projectContext }),
      })

      if (!res.ok) {
        throw new Error('Failed to get response')
      }

      const data = await res.json()
      const agentMessages: Message[] = [
        { sender: 'Agent', text: data.summary },
        ...data.suggestions.map((s: string) => ({ sender: 'Agent', text: `💡 ${s}` }))
      ]
      setMessages(prev => [...prev, ...agentMessages])
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'Agent', text: 'Error: Could not process request.' }])
    } finally {
      setIsLoading(false)
      setInput('')
    }
  }

  return (
    <div className="px-6 py-4 glass-effect border-t border-white/10 flex flex-col gap-3 h-full">
      {/* API Key Section */}
      <div>
        <h4 className="text-sm font-semibold text-text-gray mb-1">Ghost Agent Controls</h4>
        <p className="text-xs text-text-gray/70">
          Provide your personal API key. It is required for executing code inside the cave.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="password"
          value={workingValue}
          onChange={(e) => setWorkingValue(e.target.value)}
          placeholder="ghost_abc123..."
          className="flex-1 bg-white/5 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-turquoise/50"
        />
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm rounded-lg bg-accent-turquoise/20 text-white hover:bg-accent-turquoise/30 transition-colors"
        >
          Save Key
        </button>
      </div>
      {saved && (
        <span className="text-xs text-accent-turquoise">API key saved locally.</span>
      )}

      {/* Chat Section */}
      <div className="flex-1 flex flex-col border-t border-white/10 pt-4">
        <h4 className="text-sm font-semibold text-text-gray mb-2">Chat with Agent</h4>
        <div className="flex-1 overflow-y-auto bg-white/5 rounded-lg p-3 mb-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-2 ${msg.sender === 'User' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block px-3 py-1 rounded-lg text-sm ${
                msg.sender === 'User' 
                  ? 'bg-accent-turquoise text-white' 
                  : 'bg-white/10 text-text-gray'
              }`}>
                {msg.text}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="text-left">
              <span className="inline-block px-3 py-1 rounded-lg text-sm bg-white/10 text-text-gray">
                Agent is thinking...
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask the agent for project planning..."
            className="flex-1 bg-white/5 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-turquoise/50"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-accent-turquoise/20 text-white hover:bg-accent-turquoise/30 transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
