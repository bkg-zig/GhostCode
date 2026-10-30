'use client'

import { InputHTMLAttributes } from 'react'

interface InputGhostProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function InputGhost({ label, className = '', ...props }: InputGhostProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-text-gray">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          w-full px-4 py-3
          bg-white/5 backdrop-blur-sm
          border border-white/10
          rounded-lg
          text-text-light placeholder-text-gray/50
          focus:outline-none focus:ring-2 focus:ring-accent-turquoise/50 focus:border-transparent
          transition-all duration-300
          ${className}
        `}
      />
    </div>
  )
}
