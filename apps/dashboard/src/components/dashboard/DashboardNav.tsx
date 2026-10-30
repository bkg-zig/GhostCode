'use client'

export default function DashboardNav({ activeCave, onCaveChange }: any) {
  return (
    <nav className="h-16 px-6 flex items-center justify-between glass-effect border-b border-white/10">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent">
          Ghost Cave
        </h1>
        {activeCave && (
          <span className="text-sm text-text-gray">
            {activeCave.name} · {activeCave.language}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <button className="px-4 py-2 text-sm hover:text-accent-turquoise transition-colors">
          Caves
        </button>
        <button className="px-4 py-2 text-sm hover:text-accent-turquoise transition-colors">
          Settings
        </button>
      </div>
    </nav>
  )
}
