// Shared types across the monorepo

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TokenBalance {
  balance: number;
  used: number;
  limit?: number;
}

export interface CaveConfig {
  language: 'python' | 'node' | 'rust';
  ramMb: number;
  cpuMillicores: number;
  tokensPerRun: number;
}

export interface ExecutionRequest {
  caveId: string;
  code: string;
  language: 'python' | 'node' | 'rust';
  apiKey: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  tokensUsed: number;
  executionTime: number;
  versionId?: string;
}

export interface ChatRequest {
  message: string;
  caveId?: string;
  context?: string[];
}

export interface ChatResponse {
  message: string;
  tokensUsed: number;
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'create_file' | 'run_code' | 'create_version' | 'explain' | 'show_canvas';
  payload: any;
}

export interface VersionDiff {
  added: number;
  removed: number;
  modified: number;
  files: string[];
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  actor: string;
  entityType: string;
  entityId: string;
  action: string;
  details?: any;
}

export interface AdminStats {
  totalUsers: number;
  totalCaves: number;
  totalTokensUsed: number;
  activeCaves: number;
  topUsers: Array<{ id: string; email: string; tokensUsed: number }>;
}

export interface WebSocketMessage {
  type: 'terminal' | 'execution' | 'token_update' | 'status';
  payload: any;
}

// Semantic Analysis Types
export interface SemanticRequest {
  language: string;
  content: string;
  filePath?: string;
}

export interface SemanticSummary {
  language: string;
  lineCount: number;
  charCount: number;
  todoMarkers: number;
  importStatements: string[];
  symbols: Symbol[];
  references: Reference[];
  health: HealthReport;
}

export interface Symbol {
  name: string;
  kind: string; // 'function', 'class', 'variable', etc.
  line: number;
  column: number;
}

export interface Reference {
  symbolName: string;
  line: number;
  column: number;
}

export interface HealthReport {
  service: string;
  components: HealthComponent[];
}

export interface HealthComponent {
  name: string;
  state: HealthState;
  details?: string;
}

export type HealthState = 'Operational' | 'Degraded' | 'Failed';

// Helper-Agent Types
export interface ChatPlanRequest {
  prompt: string;
  context?: string;
}

export interface ChatPlanResponse {
  summary: string;
  suggestions: string[];
}

export interface AgentAdvice {
  content: string;
  level: 'info' | 'warning' | 'error';
  timestamp: string;
}
