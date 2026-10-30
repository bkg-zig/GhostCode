'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthModal from '@/components/auth/AuthModal'

function HomeContent() {
  const [initialEmail, setInitialEmail] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailFromUrl = searchParams.get('email')
    if (emailFromUrl) {
      setInitialEmail(emailFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    const probeSession = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/tokens/balance`, {
          credentials: 'include',
        })
        if (response.ok) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Session probe failed', error)
      }
    }

    probeSession()
  }, [router])

  const handleAuthSuccess = ({ apiKey }: { apiKey: string }) => {
    if (apiKey && typeof window !== 'undefined') {
      localStorage.setItem('ghost_api_key', apiKey)
    }
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12 fade-in">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-accent bg-clip-text text-transparent">
            Ghost Coding Cave
          </h1>
          <p className="text-xl text-text-gray">
            Elite Cloud IDE & AI Development Platform
          </p>
        </div>

        <AuthModal
          onClose={() => {}}
          onSuccess={handleAuthSuccess}
          initialEmail={initialEmail}
        />
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center p-4 text-text-gray">Loading…</main>}>
      <HomeContent />
    </Suspense>
  )
}
