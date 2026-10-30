'use client'

interface FooterStatusProps {
  tokenBalance: number
  isConnected: boolean
  status: string
}

export default function FooterStatus({ tokenBalance, isConnected, status }: FooterStatusProps) {
  return (
    <div className="h-10 px-6 flex items-center justify-between glass-effect border-t border-white/10 text-xs">
      <div className="flex items-center gap-4">
        <span className="text-text-gray">
          Tokens: <span className="text-accent-turquoise font-semibold">{tokenBalance}</span>
        </span>
        <span className="text-text-gray/70">{status}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-text-gray">
          {isConnected ? 'Streaming' : 'Idle'}
        </span>
      </div>
    </div>
  )
}
