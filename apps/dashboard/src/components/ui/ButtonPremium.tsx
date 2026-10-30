'use client'

import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonPremiumProps {
  children: ReactNode
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
}

export default function ButtonPremium({
  children,
  onClick,
  loading = false,
  disabled = false,
  fullWidth = false,
  variant = 'primary',
  className = '',
}: ButtonPremiumProps) {
  const variantStyles = {
    primary: 'bg-gradient-accent hover:shadow-glow',
    secondary: 'bg-white/10 hover:bg-white/20',
    danger: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variantStyles[variant]}
        px-6 py-3 rounded-lg
        font-medium text-text-light
        transition-all duration-300
        hover-scale
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  )
}
