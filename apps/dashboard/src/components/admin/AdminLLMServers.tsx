'use client'

import { useState, useEffect } from 'react'
import { 
  Server, Plus, Settings, Trash2, Cpu, Cloud, Shield,
  Package, Bot, Key, TrendingUp, ChevronDown, ChevronRight
} from 'lucide-react'
import CardPremium from '../ui/CardPremium'
import ButtonPremium from '../ui/ButtonPremium'

interface LLMServer {
  id: string
  name: string
  type: 'ollama' | 'openai' | 'anthropic' | 'custom'
  url: string
  status: 'online' | 'offline'
  models: string[]
}

const serverTypes = {
  ollama: {
    name: 'Ollama',
    icon: Cpu,
    color: 'blue',
    subTabs: ['models', 'mcp', 'settings']
  },
  openai: {
    name: 'OpenAI',
    icon: Cloud,
    color: 'green',
    subTabs: ['models', 'api-keys', 'usage']
  },
  anthropic: {
    name: 'Anthropic',
    icon: Shield,
    color: 'purple',
    subTabs: ['models', 'api-keys', 'usage']
  },
  custom: {
    name: 'Custom',
    icon: Server,
    color: 'gray',
    subTabs: ['models', 'settings']
  }
}

export default function AdminLLMServers() {
  const [servers, setServers] = useState<LLMServer[]>([])
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState('models')
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      const token = localStorage.getItem('ghost_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/llm-servers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setServers(data.servers || [])
      }
    } catch (error) {
      console.error('Failed to load LLM servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleServer = (serverId: string) => {
    const newExpanded = new Set(expandedServers)
    if (newExpanded.has(serverId)) {
      newExpanded.delete(serverId)
    } else {
      newExpanded.add(serverId)
    }
    setExpandedServers(newExpanded)
    setSelectedServer(serverId)
  }

  const getSubTabs = (serverType: string) => {
    return serverTypes[serverType as keyof typeof serverTypes]?.subTabs || []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-light">LLM Server Management</h2>
          <p className="text-sm text-text-gray mt-1">
            Verwalte Ollama, OpenAI, Anthropic und Custom LLM Servers
          </p>
        </div>
        <ButtonPremium>
          <Plus className="w-4 h-4 mr-2" />
          Server hinzufügen
        </ButtonPremium>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-turquoise"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {servers.map(server => {
            const serverType = serverTypes[server.type]
            const Icon = serverType.icon
            const isExpanded = expandedServers.has(server.id)
            const subTabs = getSubTabs(server.type)

            return (
              <CardPremium key={server.id}>
                <div className="p-4">
                  {/* Server Header */}
                  <button
                    onClick={() => toggleServer(server.id)}
                    className="w-full flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-accent-turquoise" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-text-gray" />
                      )}
                      <div className={`p-2 rounded-lg bg-${serverType.color}-500/20`}>
                        <Icon className={`w-5 h-5 text-${serverType.color}-400`} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-text-light">{server.name}</h3>
                        <p className="text-xs text-text-gray">{serverType.name} · {server.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${server.status === 'online'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                        }
                      `}>
                        {server.status}
                      </span>
                      <span className="text-xs text-text-gray">
                        {server.models.length} Models
                      </span>
                    </div>
                  </button>

                  {/* Expanded Content with Sub-Tabs */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      {/* Sub-Tab Navigation */}
                      <div className="flex gap-2 mb-4">
                        {subTabs.map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveSubTab(tab)}
                            className={`
                              px-3 py-1.5 rounded-lg text-sm font-medium transition
                              ${activeSubTab === tab
                                ? 'bg-accent-turquoise/20 text-accent-turquoise'
                                : 'bg-white/5 text-text-gray hover:bg-white/10'
                              }
                            `}
                          >
                            {tab === 'models' && <Package className="w-4 h-4 inline mr-1" />}
                            {tab === 'mcp' && <Bot className="w-4 h-4 inline mr-1" />}
                            {tab === 'api-keys' && <Key className="w-4 h-4 inline mr-1" />}
                            {tab === 'usage' && <TrendingUp className="w-4 h-4 inline mr-1" />}
                            {tab === 'settings' && <Settings className="w-4 h-4 inline mr-1" />}
                            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                          </button>
                        ))}
                      </div>

                      {/* Sub-Tab Content */}
                      <div className="glass-effect rounded-lg p-4">
                        {activeSubTab === 'models' && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-text-light mb-3">
                              Verfügbare Models
                            </h4>
                            {server.models.map(model => (
                              <div
                                key={model}
                                className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition"
                              >
                                <span className="text-sm text-text-light">{model}</span>
                                <button className="text-xs text-accent-turquoise hover:underline">
                                  Details
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeSubTab === 'mcp' && (
                          <div>
                            <p className="text-sm text-text-gray">MCP Models für {server.name}</p>
                          </div>
                        )}

                        {activeSubTab === 'api-keys' && (
                          <div>
                            <p className="text-sm text-text-gray">API Key Management</p>
                          </div>
                        )}

                        {activeSubTab === 'usage' && (
                          <div>
                            <p className="text-sm text-text-gray">Usage Statistics</p>
                          </div>
                        )}

                        {activeSubTab === 'settings' && (
                          <div>
                            <p className="text-sm text-text-gray">Server Settings</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardPremium>
            )
          })}
        </div>
      )}

      {!loading && servers.length === 0 && (
        <CardPremium>
          <div className="p-12 text-center">
            <Server className="w-12 h-12 mx-auto mb-4 text-text-gray" />
            <h3 className="text-lg font-semibold text-text-light mb-2">
              Keine LLM Server konfiguriert
            </h3>
            <p className="text-sm text-text-gray mb-6">
              Füge deinen ersten LLM Server hinzu um zu starten
            </p>
            <ButtonPremium>
              <Plus className="w-4 h-4 mr-2" />
              Server hinzufügen
            </ButtonPremium>
          </div>
        </CardPremium>
      )}
    </div>
  )
}
