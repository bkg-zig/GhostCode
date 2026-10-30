'use client'

import Editor from '@monaco-editor/react'

interface CodeEditorProps {
  language: string
  value: string
  onChange: (value: string) => void
  onRun: () => void
  onSave: () => void
  isRunning: boolean
  isSaving: boolean
  isDirty: boolean
}

export default function CodeEditor({
  language,
  value,
  onChange,
  onRun,
  onSave,
  isRunning,
  isSaving,
  isDirty,
}: CodeEditorProps) {
  return (
    <div className="glass-effect rounded-lg p-0 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <h3 className="text-sm font-semibold text-text-gray">Editor</h3>
          <span className="text-xs uppercase tracking-wide text-text-gray/70">
            {language}
            {isDirty ? ' · unsaved' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              isDirty
                ? isSaving
                  ? 'bg-white/10 text-text-gray cursor-wait'
                  : 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-white/5 text-text-gray cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving…' : isDirty ? 'Save' : 'Saved'}
          </button>
          <button
            onClick={onRun}
            disabled={isRunning}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              isRunning
                ? 'bg-white/10 text-text-gray cursor-not-allowed'
                : 'bg-accent-turquoise/20 text-white hover:bg-accent-turquoise/30'
            }`}
          >
            {isRunning ? 'Running…' : 'Run'}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          theme="vs-dark"
          language={language}
          value={value}
          onChange={(val) => onChange(val ?? '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  )
}
