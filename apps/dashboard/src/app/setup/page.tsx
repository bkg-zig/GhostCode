'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CardPremium from '@/components/ui/CardPremium'
import ButtonPremium from '@/components/ui/ButtonPremium'
import InputGhost from '@/components/ui/InputGhost'
import { Key, Check } from 'lucide-react'

function SetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [apiKey, setApiKey] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Get API key from URL parameter
    const keyFromUrl = searchParams.get('key')
    if (keyFromUrl) {
      setApiKey(keyFromUrl)
    }
  }, [searchParams])

  const handleSetup = async () => {
    setError('')
    
    if (!apiKey) {
      setError('Bitte API-Key eingeben')
      return
    }

    if (!password || password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Setup fehlgeschlagen')
      }

      setSuccess(true)
      setError('')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/?email=' + encodeURIComponent(data.email))
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-6">
      <CardPremium className="max-w-md w-full">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-turquoise/20 mb-4">
              <Key className="w-8 h-8 text-accent-turquoise" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent mb-2">
              Passwort festlegen
            </h1>
            <p className="text-sm text-text-gray">
              Setze dein Passwort um deinen Account zu aktivieren
            </p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-text-light mb-2">
                ✅ Passwort erfolgreich gesetzt!
              </h3>
              <p className="text-sm text-text-gray">
                Du wirst zum Login weitergeleitet...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <InputGhost
                  label="API-Key"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="ghost_..."
                  disabled={!!searchParams.get('key')}
                />

                <InputGhost
                  label="Neues Passwort"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                />

                <InputGhost
                  label="Passwort bestätigen"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                />

                <ButtonPremium
                  onClick={handleSetup}
                  loading={loading}
                  fullWidth
                >
                  Passwort festlegen
                </ButtonPremium>

                <div className="text-center">
                  <button
                    onClick={() => router.push('/')}
                    className="text-sm text-text-gray hover:text-accent-turquoise transition"
                  >
                    Zurück zum Login
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </CardPremium>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-gray">Loading…</div>}>
      <SetupContent />
    </Suspense>
  )
}
