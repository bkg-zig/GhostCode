'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardPremiumProps {
  children: ReactNode
  className?: string
  glow?: boolean
}

export default function CardPremium({ children, className = '', glow = false }: CardPremiumProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-effect rounded-xl shadow-premium ${glow ? 'glow-effect' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
