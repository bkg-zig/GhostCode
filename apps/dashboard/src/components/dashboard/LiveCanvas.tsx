'use client'

import { useEffect, useRef, useState } from 'react'
import '@xterm/xterm/css/xterm.css'

type TerminalType = import('@xterm/xterm').Terminal
type FitAddonType = import('@xterm/addon-fit').FitAddon

interface TerminalPaneProps {
  logs: string[]
  status: string
}

interface AgentAdvice {
  content: string
  level: string
  timestamp: string
}

export default function LiveCanvas({ logs, status }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<TerminalType | null>(null)
  const fitAddonRef = useRef<FitAddonType | null>(null)
  const renderedCountRef = useRef(0)
  const [agentLogs, setAgentLogs] = useState<AgentAdvice[]>([])

  useEffect(() => {
    let disposed = false
    let terminalInstance: TerminalType | null = null
    let fitAddonInstance: FitAddonType | null = null
    let detachResize: (() => void) | null = null

    const setup = async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
      ])

      if (disposed) return

      const terminal = new Terminal({
        convertEol: true,
        fontFamily: 'Fira Code, monospace',
        fontSize: 13,
        theme: {
          background: '#0f172a',
          foreground: '#e2e8f0',
        },
      })
      const fitAddon = new FitAddon()
      terminal.loadAddon(fitAddon)

      terminalInstance = terminal
      fitAddonInstance = fitAddon
      terminalRef.current = terminal
      fitAddonRef.current = fitAddon

      if (containerRef.current) {
        terminal.open(containerRef.current)
        fitAddon.fit()
      }

      terminal.writeln('🌀 Ghost Execution Terminal ready')

      const handleResize = () => fitAddon.fit()
      window.addEventListener('resize', handleResize)
      detachResize = () => window.removeEventListener('resize', handleResize)
    }

    setup()

    return () => {
      disposed = true
      detachResize?.()
      detachResize = null
      terminalInstance?.dispose()
    }
  }, [])

  // WebSocket connection for LiveAdvisor
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4003/ws/agent')

    ws.onopen = () => {
      console.log('Connected to LiveAdvisor WebSocket')
    }

    ws.onmessage = (event) => {
      try {
        const advice: AgentAdvice = JSON.parse(event.data)
        setAgentLogs(prev => [...prev.slice(-9), advice]) // Keep last 10 messages
      } catch (error) {
        console.error('Failed to parse agent advice:', error)
      }
    }

    ws.onclose = () => {
      console.log('Disconnected from LiveAdvisor WebSocket')
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    const terminal = terminalRef.current
    if (!terminal) return

    if (logs.length === 0) {
      terminal.clear()
      terminal.writeln('🌀 Ghost Execution Terminal ready')
      renderedCountRef.current = 0
      return
    }

    for (; renderedCountRef.current < logs.length; renderedCountRef.current += 1) {
      terminal.writeln(logs[renderedCountRef.current])
    }
  }, [logs])

  useEffect(() => {
    if (!fitAddonRef.current) return
    const timeout = setTimeout(() => fitAddonRef.current?.fit(), 10)
    return () => clearTimeout(timeout)
  }, [logs])

  return (
    <div className="glass-effect rounded-lg overflow-hidden flex flex-col min-h-0">
      <div className="px-4 py-2 border-b border-white/10 text-sm text-text-gray flex items-center justify-between">
        <span>Execution Log & Live Agent</span>
        <span className="text-xs uppercase tracking-wide opacity-70">{status}</span>
      </div>
      <div className="flex-1 bg-black/70 flex flex-col">
        {/* Agent Advice Section */}
        <div className="flex-1 overflow-y-auto p-3 border-b border-white/10">
          <div className="text-xs text-text-gray mb-2">Live Agent Feedback:</div>
          {agentLogs.length === 0 ? (
            <div className="text-xs text-text-gray/50">Waiting for agent feedback...</div>
          ) : (
            agentLogs.map((advice, idx) => (
              <div key={idx} className={`mb-1 text-xs ${
                advice.level === 'error' ? 'text-red-400' :
                advice.level === 'warning' ? 'text-yellow-400' :
                advice.level === 'info' ? 'text-blue-400' : 'text-text-gray'
              }`}>
                [{new Date(advice.timestamp).toLocaleTimeString()}] {advice.content}
              </div>
            ))
          )}
        </div>
        {/* Terminal Section */}
        <div className="flex-1">
          <div ref={containerRef} className="h-full" />
        </div>
      </div>
    </div>
  )
}
