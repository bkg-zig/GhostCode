'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Activity, Shield, Coins, Server, Terminal,
  FileText, Database, ArrowLeft, LogOut, Settings
} from 'lucide-react'
import AdminOverview from '@/components/admin/AdminOverview'
import AdminUsers from '@/components/admin/AdminUsers'
import AdminCaves from '@/components/admin/AdminCaves'
import AdminAPIKeys from '@/components/admin/AdminAPIKeys'
import AdminTokens from '@/components/admin/AdminTokens'
import AdminLLMServers from '@/components/admin/AdminLLMServers'
import AdminMCPOllama from '@/components/admin/AdminMCPOllama'
import AdminLogs from '@/components/admin/AdminLogs'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ghost_token')
    const userData = localStorage.getItem('ghost_user')
    
    if (!token || !userData) {
      router.push('/')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    setUser(parsedUser)
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('ghost_token')
    localStorage.removeItem('ghost_user')
    router.push('/')
  }

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: Activity },
    { id: 'users', label: 'Benutzer', icon: Users },
    { id: 'caves', label: 'Caves', icon: Database },
    { id: 'apikeys', label: 'API-Keys', icon: Shield },
    { id: 'tokens', label: 'Token-Stats', icon: Coins },
    { id: 'llm-servers', label: 'LLM Servers', icon: Server },
    { id: 'mcp-ollama', label: 'MCP Ollama', icon: Terminal },
    { id: 'logs', label: 'Logs', icon: FileText }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-turquoise"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-text-gray hover:text-accent-turquoise transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </button>
              <h1 className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                👻 Ghost Cave Admin
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-gray">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-all
                  ${activeTab === tab.id
                    ? 'border-accent-turquoise text-accent-turquoise'
                    : 'border-transparent text-text-gray hover:text-text-light hover:border-white/20'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'caves' && <AdminCaves />}
        {activeTab === 'apikeys' && <AdminAPIKeys />}
        {activeTab === 'tokens' && <AdminTokens />}
        {activeTab === 'llm-servers' && <AdminLLMServers />}
        {activeTab === 'mcp-ollama' && <AdminMCPOllama />}
        {activeTab === 'logs' && <AdminLogs />}
      </main>
    </div>
  )
}
