'use client'

import { SemanticSummary, Symbol, Reference } from '@ghost/types'

interface AnalysisPanelProps {
  analysis: SemanticSummary | null
  isVisible: boolean
  onClose: () => void
}

export default function AnalysisPanel({ analysis, isVisible, onClose }: AnalysisPanelProps) {
  if (!isVisible || !analysis) return null

  return (
    <div className="glass-effect rounded-lg overflow-hidden flex flex-col min-h-0">
      <div className="px-4 py-2 border-b border-white/10 text-sm text-text-gray flex items-center justify-between">
        <span>Semantic Analysis</span>
        <button
          onClick={onClose}
          className="text-xs text-text-gray/70 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-text-gray/70 uppercase tracking-wide">Lines</div>
            <div className="text-lg font-semibold text-white">{analysis.lineCount}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-text-gray/70 uppercase tracking-wide">Characters</div>
            <div className="text-lg font-semibold text-white">{analysis.charCount}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-text-gray/70 uppercase tracking-wide">TODO Markers</div>
            <div className="text-lg font-semibold text-yellow-400">{analysis.todoMarkers}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-text-gray/70 uppercase tracking-wide">Imports</div>
            <div className="text-lg font-semibold text-blue-400">{analysis.importStatements.length}</div>
          </div>
        </div>

        {/* Symbols */}
        {analysis.symbols.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-text-gray mb-2">Symbols</h4>
            <div className="space-y-1">
              {analysis.symbols.map((symbol, idx) => (
                <div key={idx} className="bg-white/5 rounded p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{symbol.name}</span>
                    <span className="text-xs text-text-gray/70 uppercase">{symbol.kind}</span>
                  </div>
                  <div className="text-xs text-text-gray/70">
                    Line {symbol.line}, Column {symbol.column}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        {analysis.references.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-text-gray mb-2">References</h4>
            <div className="space-y-1">
              {analysis.references.map((ref, idx) => (
                <div key={idx} className="bg-white/5 rounded p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{ref.symbolName}</span>
                    <span className="text-xs text-text-gray/70">Reference</span>
                  </div>
                  <div className="text-xs text-text-gray/70">
                    Line {ref.line}, Column {ref.column}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Imports */}
        {analysis.importStatements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-text-gray mb-2">Import Statements</h4>
            <div className="space-y-1">
              {analysis.importStatements.map((imp, idx) => (
                <div key={idx} className="bg-white/5 rounded p-2 text-sm font-mono text-blue-300">
                  {imp}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Status */}
        <div>
          <h4 className="text-sm font-semibold text-text-gray mb-2">Service Health</h4>
          <div className="space-y-1">
            {analysis.health.components.map((component, idx) => (
              <div key={idx} className="bg-white/5 rounded p-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{component.name}</span>
                  <span className={`text-xs uppercase ${
                    component.state === 'Operational' ? 'text-green-400' :
                    component.state === 'Degraded' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {component.state}
                  </span>
                </div>
                {component.details && (
                  <div className="text-xs text-text-gray/70 mt-1">{component.details}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
