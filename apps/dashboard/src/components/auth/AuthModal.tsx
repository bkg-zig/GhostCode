'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import ButtonPremium from '../ui/ButtonPremium'
import InputGhost from '../ui/InputGhost'
import CardPremium from '../ui/CardPremium'

interface AuthModalProps {
  onClose: () => void
  onSuccess: (result: { apiKey: string }) => void
  initialEmail?: string
}

export default function AuthModal({ onClose, onSuccess, initialEmail = '' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [loginApiKey, setLoginApiKey] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed')
        }

        // Show setup URL
        setGeneratedKey(data.setupUrl)
        setError('')
      } else {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Login failed')
        }

        const trimmedKey = loginApiKey.trim()
        if (trimmedKey && typeof window !== 'undefined') {
          localStorage.setItem('ghost_api_key', trimmedKey)
        }

        onSuccess({ apiKey: trimmedKey })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <CardPremium>
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>

          {generatedKey && (
            <div className="mb-6 p-4 glass-effect rounded-lg">
              <p className="text-sm font-semibold text-accent-turquoise mb-2">✅ Registrierung erfolgreich!</p>
              <p className="text-sm text-text-gray mb-3">
                Bitte öffne diesen Link um dein Passwort zu setzen:
              </p>
              <a 
                href={generatedKey}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent-turquoise hover:underline break-all"
              >
                {generatedKey}
              </a>
              <p className="text-xs text-text-gray mt-3">
                In Production erhältst du diesen Link per Email.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <InputGhost
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />

            {mode === 'login' && (
              <InputGhost
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            )}

            {mode === 'login' && (
              <InputGhost
                label="API Key"
                type="password"
                value={loginApiKey}
                onChange={(e) => setLoginApiKey(e.target.value)}
                placeholder="ghost_xxxxx"
              />
            )}

            <ButtonPremium
              onClick={handleAuth}
              loading={loading}
              fullWidth
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </ButtonPremium>

            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="w-full text-center text-sm text-text-gray hover:text-accent-turquoise transition-colors"
            >
              {mode === 'login' 
                ? "Don't have an account? Register" 
                : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </CardPremium>
    </motion.div>
  )
}
