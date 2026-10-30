'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Shield } from 'lucide-react'
import CardPremium from '../ui/CardPremium'
import ButtonPremium from '../ui/ButtonPremium'

interface APIKey {
  id: string
  name: string
  key: string
  userId: string
  permissions: string[]
  rateLimit: number
  createdAt: string
  lastUsed?: string
}

export default function AdminAPIKeys() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAPIKeys()
  }, [])

  const loadAPIKeys = async () => {
    try {
      const token = localStorage.getItem('ghost_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.keys || [])
      }
    } catch (error) {
      console.error('Failed to load API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    setShowApiKey(prev => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Show toast notification
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-light">API Key Management</h2>
          <p className="text-sm text-text-gray mt-1">
            Verwalte API-Schlüssel, Permissions und Rate Limits
          </p>
        </div>
        <ButtonPremium>
          <Plus className="w-4 h-4 mr-2" />
          Neuen API-Key erstellen
        </ButtonPremium>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-turquoise"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map(apiKey => (
            <CardPremium key={apiKey.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent-turquoise/20">
                      <Key className="w-5 h-5 text-accent-turquoise" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-light">{apiKey.name}</h3>
                      <p className="text-xs text-text-gray">User ID: {apiKey.userId}</p>
                    </div>
                  </div>
                  <button
                    className="text-red-400 hover:text-red-300 transition"
                    title="Delete API Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* API Key */}
                <div className="glass-effect rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-accent-turquoise">
                      {showApiKey[apiKey.id] ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="p-1 hover:bg-white/10 rounded transition"
                      >
                        {showApiKey[apiKey.id] ? (
                          <EyeOff className="w-4 h-4 text-text-gray" />
                        ) : (
                          <Eye className="w-4 h-4 text-text-gray" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="p-1 hover:bg-white/10 rounded transition"
                      >
                        <Copy className="w-4 h-4 text-text-gray" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Permissions & Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-text-gray mb-1">Permissions</p>
                    <div className="flex flex-wrap gap-1">
                      {apiKey.permissions.map(perm => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 bg-accent-violet/20 text-accent-violet text-xs rounded"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-text-gray mb-1">Rate Limit</p>
                    <p className="text-sm font-semibold text-text-light">
                      {apiKey.rateLimit} req/min
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-gray mb-1">Last Used</p>
                    <p className="text-sm font-semibold text-text-light">
                      {apiKey.lastUsed
                        ? new Date(apiKey.lastUsed).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardPremium>
          ))}
        </div>
      )}

      {!loading && apiKeys.length === 0 && (
        <CardPremium>
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-text-gray" />
            <h3 className="text-lg font-semibold text-text-light mb-2">
              Keine API-Keys vorhanden
            </h3>
            <p className="text-sm text-text-gray mb-6">
              Erstelle einen neuen API-Schlüssel um zu starten
            </p>
            <ButtonPremium>
              <Plus className="w-4 h-4 mr-2" />
              API-Key erstellen
            </ButtonPremium>
          </div>
        </CardPremium>
      )}
    </div>
  )
}
