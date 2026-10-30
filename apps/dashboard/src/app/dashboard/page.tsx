'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'
import FileExplorer from '@/components/dashboard/FileExplorer'
import CodeEditor from '@/components/dashboard/CodeEditor'
import LiveCanvas from '@/components/dashboard/LiveCanvas'
import ChatAgent from '@/components/dashboard/ChatAgent'
import FooterStatus from '@/components/dashboard/FooterStatus'

type FileSummary = {
  path: string
  name: string
  size: number
  updatedAt: string
}

type Cave = {
  id: string
  name: string
  language: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003'
const LOG_WS_BASE = process.env.NEXT_PUBLIC_GHOST_LOG_WS_URL || 'ws://localhost:4005/ws/logs'

const LANGUAGE_MAP: Record<string, string> = {
  py: 'python',
  ts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  tsx: 'typescript',
  rs: 'rust',
  json: 'json',
  md: 'markdown',
  html: 'html',
  css: 'css',
  sh: 'shell',
  yml: 'yaml',
  yaml: 'yaml',
}

const getLanguageFromPath = (path: string) => {
  const extension = path.split('.').pop()?.toLowerCase() ?? ''
  return LANGUAGE_MAP[extension] || 'plaintext'
}

export default function Dashboard() {
  const router = useRouter()
  const [files, setFiles] = useState<FileSummary[]>([])
  const [fileContents, setFileContents] = useState<Record<string, { content: string; updatedAt: string }>>({})
  const [dirtyPaths, setDirtyPaths] = useState<Set<string>>(new Set())
  const [activePath, setActivePath] = useState<string | null>(null)
  const [activeCave, setActiveCave] = useState<Cave | null>(null)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState('Idle')
  const [isConnected, setIsConnected] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const socketRef = useRef<WebSocket | null>(null)
  const isMountedRef = useRef(false)

  const activeFile = useMemo(
    () => (activePath ? files.find((file) => file.path === activePath) ?? null : null),
    [files, activePath]
  )
  const editorContent = activePath ? fileContents[activePath]?.content ?? '' : ''
  const editorLanguage = activeFile ? getLanguageFromPath(activeFile.path) : 'plaintext'
  const isDirty = activePath ? dirtyPaths.has(activePath) : false

  const fetchWithCredentials = useCallback(
    (path: string, init?: RequestInit) =>
      fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...init,
      }),
    []
  )

  const appendLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, message])
  }, [])

  const refreshTokenBalance = useCallback(async () => {
    try {
      const response = await fetchWithCredentials('/api/user/tokens/balance')
      if (response.status === 401) {
        router.push('/')
        return
      }
      if (response.ok) {
        const data = await response.json()
        setTokenBalance(data.balance)
      }
    } catch (error) {
      console.error('Failed to refresh tokens', error)
    }
  }, [fetchWithCredentials, router])

  const loadFileContent = useCallback(
    async (caveId: string, path: string) => {
      const params = new URLSearchParams({ path })
      const response = await fetchWithCredentials(`/api/caves/${caveId}/files/content?${params.toString()}`)
      if (!response.ok) {
        console.error('Failed to load file content')
        return
      }
      const data = await response.json()
      setFileContents((prev) => ({
        ...prev,
        [data.path]: {
          content: data.content ?? '',
          updatedAt: data.updatedAt,
        },
      }))
      setDirtyPaths((prev) => {
        const next = new Set(prev)
        next.delete(data.path)
        return next
      })
    },
    [fetchWithCredentials]
  )

  const loadFiles = useCallback(
    async (caveId: string, selectFirst = false) => {
      const response = await fetchWithCredentials(`/api/caves/${caveId}/files`)
      if (!response.ok) {
        console.error('Failed to load files')
        return
      }

      const data = await response.json()
      const summaries: FileSummary[] = (data.files ?? []).map((file: any) => ({
        path: file.path,
        name: file.name ?? file.path.split('/').pop() ?? file.path,
        size: Number(file.size) || 0,
        updatedAt: file.updatedAt,
      }))

      const validPaths = new Set(summaries.map((file) => file.path))

      setFiles(summaries)
      setFileContents((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((key) => {
          if (!validPaths.has(key)) {
            delete next[key]
          }
        })
        return next
      })
      setDirtyPaths((prev) => {
        const next = new Set<string>()
        prev.forEach((path) => {
          if (validPaths.has(path)) {
            next.add(path)
          }
        })
        return next
      })

      if (selectFirst) {
        const first = summaries[0]
        setActivePath(first ? first.path : null)
        if (first) {
          await loadFileContent(caveId, first.path)
        }
      }
    },
    [fetchWithCredentials, loadFileContent]
  )

  useEffect(() => {
    isMountedRef.current = true

    if (typeof window !== 'undefined') {
      const storedKey = window.localStorage.getItem('ghost_api_key')
      if (storedKey) {
        setApiKey(storedKey)
      }
    }

    const bootstrap = async () => {
      await refreshTokenBalance()

      try {
        const cavesResponse = await fetchWithCredentials('/api/caves/list')
        if (cavesResponse.status === 401) {
          router.push('/')
          return
        }

        let caves: Cave[] = []
        if (cavesResponse.ok) {
          caves = await cavesResponse.json()
        }

        if (!caves.length) {
          const createResponse = await fetchWithCredentials('/api/caves/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Main Python Cave', language: 'python' }),
          })

          if (createResponse.ok) {
            const cave = await createResponse.json()
            caves = [cave]
          }
        }

        if (caves.length) {
          const primaryCave = caves[0]
          setActiveCave(primaryCave)
          await loadFiles(primaryCave.id, true)
        }
      } catch (error) {
        console.error('Failed to bootstrap dashboard', error)
      }
    }

    bootstrap()

    return () => {
      isMountedRef.current = false
      socketRef.current?.close()
    }
  }, [fetchWithCredentials, refreshTokenBalance, router, loadFiles])

  const handleSelectFile = useCallback(
    async (path: string) => {
      if (!activeCave) return
      setActivePath(path)
      if (!fileContents[path]) {
        await loadFileContent(activeCave.id, path)
      }
    },
    [activeCave, fileContents, loadFileContent]
  )

  const handleFileContentChange = useCallback(
    (value: string) => {
      if (!activePath) return
      setFileContents((prev) => ({
        ...prev,
        [activePath]: {
          content: value,
          updatedAt: prev[activePath]?.updatedAt ?? new Date().toISOString(),
        },
      }))
      setDirtyPaths((prev) => {
        if (prev.has(activePath)) {
          return prev
        }
        const next = new Set(prev)
        next.add(activePath)
        return next
      })
    },
    [activePath]
  )

  const resetTerminal = useCallback(() => {
    setLogs([])
    setStatus('Idle')
    setIsConnected(false)
  }, [])

  const handleSaveActiveFile = useCallback(async () => {
    if (!activeCave || !activePath) {
      return false
    }

    const content = fileContents[activePath]?.content ?? ''
    setIsSaving(true)
    try {
      const response = await fetchWithCredentials(`/api/caves/${activeCave.id}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: activePath, content }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        const message = errorPayload?.message || errorPayload?.detail || 'Unable to save file'
        appendLog(`❌ ${message}`)
        return false
      }

      const data = await response.json()
      setFiles((prev) => {
        const next = prev
          .map((file) =>
            file.path === data.path
              ? { path: data.path, name: data.name ?? data.path, size: data.size ?? 0, updatedAt: data.updatedAt }
              : file
          )
          .slice()

        if (!next.find((file) => file.path === data.path)) {
          next.push({
            path: data.path,
            name: data.name ?? data.path,
            size: data.size ?? 0,
            updatedAt: data.updatedAt,
          })
          next.sort((a, b) => a.path.localeCompare(b.path))
        }

        return next
      })

      setFileContents((prev) => ({
        ...prev,
        [data.path]: {
          content,
          updatedAt: data.updatedAt,
        },
      }))

      setDirtyPaths((prev) => {
        const next = new Set(prev)
        next.delete(data.path)
        return next
      })

      return true
    } finally {
      setIsSaving(false)
    }
  }, [activeCave, activePath, fileContents, fetchWithCredentials, appendLog])

  const handleRun = useCallback(async () => {
    if (!activeCave || !activePath) {
      appendLog('⚠️  Select a file to run')
      return
    }

    if (!apiKey) {
      resetTerminal()
      appendLog('⚠️  API key required. Save it below before executing.')
      setStatus('API key missing')
      return
    }

    if (dirtyPaths.has(activePath)) {
      const saved = await handleSaveActiveFile()
      if (!saved) {
        return
      }
    }

    socketRef.current?.close()

    setLogs([])
    setIsRunning(true)
    setStatus('Starting')

    try {
      const response = await fetchWithCredentials('/api/caves/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          caveId: activeCave.id,
          code: fileContents[activePath]?.content ?? '',
        }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        const message = errorPayload?.message || errorPayload?.detail || 'Execution failed'
        appendLog(`❌ ${message}`)
        setStatus('Error')
        setIsRunning(false)
        return
      }

      const data = await response.json()
      if (typeof data.tokenBalance === 'number') {
        setTokenBalance(data.tokenBalance)
      }

      const wsBase = LOG_WS_BASE.replace(/\/$/, '')
      const streamUrl = (data.logStreamUrl as string | undefined) || `${wsBase}/${data.jobId}`

      const socket = new WebSocket(streamUrl)
      socketRef.current = socket

      socket.onopen = () => {
        setIsConnected(true)
        setStatus('Running')
      }

      socket.onerror = () => {
        appendLog('❌ WebSocket connection error')
        setStatus('Error')
        setIsRunning(false)
      }

      socket.onclose = () => {
        setIsConnected(false)
        setIsRunning(false)
      }

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'log') {
            const line = payload.data?.toString().replace(/\n$/, '')
            const stream = payload.stream?.toUpperCase?.() || 'LOG'
            appendLog(`[${stream}] ${line}`)
          } else if (payload.type === 'status') {
            if (payload.stage === 'finished') {
              setStatus(`Finished (exit ${payload.returnCode ?? 0})`)
              setIsRunning(false)
              refreshTokenBalance()
            } else if (payload.stage === 'error') {
              setStatus('Execution error')
              setIsRunning(false)
            } else if (payload.stage === 'starting') {
              setStatus('Running')
            }
          }
        } catch (err) {
          appendLog(event.data)
        }
      }
    } catch (error) {
      console.error('Execution error', error)
      appendLog('❌ Unable to reach API')
      setStatus('Error')
      setIsRunning(false)
    }
  }, [
    activeCave,
    activePath,
    apiKey,
    fileContents,
    dirtyPaths,
    fetchWithCredentials,
    appendLog,
    handleSaveActiveFile,
    resetTerminal,
    refreshTokenBalance,
  ])

  const handleCreateFile = useCallback(async () => {
    if (!activeCave) return

    const suggestion = activePath || 'main.py'
    const newPathInput = typeof window !== 'undefined'
      ? window.prompt('New file path (e.g. src/main.py)', suggestion)
      : null
    if (!newPathInput) return

    setIsSaving(true)
    try {
      const response = await fetchWithCredentials(`/api/caves/${activeCave.id}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPathInput, content: '' }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        const message = errorPayload?.message || errorPayload?.detail || 'Unable to create file'
        appendLog(`❌ ${message}`)
        return
      }

      const data = await response.json()
      await loadFiles(activeCave.id)
      setActivePath(data.path)
      setFileContents((prev) => ({
        ...prev,
        [data.path]: {
          content: '',
          updatedAt: data.updatedAt,
        },
      }))
      setDirtyPaths((prev) => {
        const next = new Set(prev)
        next.add(data.path)
        return next
      })
    } finally {
      setIsSaving(false)
    }
  }, [activeCave, activePath, fetchWithCredentials, appendLog, loadFiles])

  const handleDeleteFile = useCallback(
    async (path: string) => {
      if (!activeCave) return
      if (!path) return

      const confirmed =
        typeof window === 'undefined' ? true : window.confirm(`Delete ${path}? This action cannot be undone.`)
      if (!confirmed) return

      setIsDeleting(true)
      try {
        const params = new URLSearchParams({ path })
        const response = await fetchWithCredentials(`/api/caves/${activeCave.id}/files?${params.toString()}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null)
          const message = errorPayload?.message || errorPayload?.detail || 'Unable to delete file'
          appendLog(`❌ ${message}`)
          return
        }

        const remainingFiles = files.filter((file) => file.path !== path)
        setFiles(remainingFiles)
        setFileContents((prev) => {
          const next = { ...prev }
          delete next[path]
          return next
        })
        setDirtyPaths((prev) => {
          const next = new Set(prev)
          next.delete(path)
          return next
        })

        if (activePath === path) {
          const nextFile = remainingFiles[0] ?? null
          setActivePath(nextFile ? nextFile.path : null)
          if (nextFile) {
            await loadFileContent(activeCave.id, nextFile.path)
          } else {
            resetTerminal()
          }
        }
      } finally {
        setIsDeleting(false)
      }
    },
    [activeCave, activePath, files, fetchWithCredentials, appendLog, loadFileContent, resetTerminal]
  )

  const handleSaveApiKey = useCallback((key: string) => {
    setApiKey(key)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ghost_api_key', key)
    }
  }, [])

  return (
    <div className="dashboard h-screen flex flex-col bg-gradient-dark">
      <DashboardNav activeCave={activeCave} onCaveChange={setActiveCave} />

      <main className="main-grid flex-1 grid grid-cols-[260px_1fr_400px] gap-4 p-4 overflow-hidden">
        <FileExplorer
          files={files}
          activePath={activePath}
          onSelect={handleSelectFile}
          onCreateFile={handleCreateFile}
          onDeleteFile={files.length ? handleDeleteFile : undefined}
          isDeleting={isDeleting}
        />

        <CodeEditor
          language={editorLanguage}
          value={editorContent}
          onChange={handleFileContentChange}
          onRun={handleRun}
          onSave={handleSaveActiveFile}
          isRunning={isRunning}
          isSaving={isSaving}
          isDirty={isDirty}
        />

        <LiveCanvas logs={logs} status={status} />
      </main>

      <ChatAgent apiKey={apiKey} onApiKeySave={handleSaveApiKey} />

      <FooterStatus tokenBalance={tokenBalance} isConnected={isConnected} status={status} />
    </div>
  )
}
