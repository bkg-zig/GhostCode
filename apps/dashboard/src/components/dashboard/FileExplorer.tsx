'use client'

interface FileExplorerProps {
  files: Array<{
    path: string
    name: string
    size: number
    updatedAt: string
  }>
  activePath: string | null
  onSelect: (path: string) => void
  onCreateFile?: () => void
  onDeleteFile?: (path: string) => void
  isDeleting?: boolean
}

export default function FileExplorer({
  files,
  activePath,
  onSelect,
  onCreateFile,
  onDeleteFile,
  isDeleting = false,
}: FileExplorerProps) {
  return (
    <div className="glass-effect rounded-lg p-4 overflow-hidden flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-semibold text-text-gray">Files</h3>
        <div className="flex items-center gap-2">
          {onDeleteFile && activePath && (
            <button
              onClick={() => onDeleteFile(activePath)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          {onCreateFile && (
            <button
              onClick={onCreateFile}
              className="text-xs text-accent-turquoise hover:text-accent-violet transition-colors"
            >
              + New
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto text-sm text-text-gray">
        {files.length === 0 && (
          <p className="text-xs opacity-70">No files yet</p>
        )}

        <ul className="space-y-1">
          {files.map(file => {
            const isActive = file.path === activePath
            const depth = Math.max(file.path.split('/').length - 1, 0)
            const extension = file.name?.split('.').pop() || ''
            return (
              <li key={file.path}>
                <button
                  onClick={() => onSelect(file.path)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent-turquoise/20 text-white'
                      : 'hover:bg-white/5'
                  }`}
                  style={{ paddingLeft: depth ? depth * 12 + 12 : 12 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium truncate">{file.name}</span>
                    <span className="text-[11px] uppercase opacity-60">
                      {extension || 'file'}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-60 truncate">
                    {file.path} · {Math.max(file.size, 0)} B
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
