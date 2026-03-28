/**
 * 数据库连接配置
 */
export interface ConnectionConfig {
  id: string
  name: string
  type: 'mysql' | 'postgresql' | 'sqlite'
  host: string
  port: number
  username: string
  password: string
  database: string
  options?: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

/**
 * 查询结果
 */
export interface QueryResult {
  rows: Record<string, unknown>[]
  fields: { name: string; type: string }[]
  affectedRows?: number
  insertId?: number
}

/**
 * 连接状态
 */
export interface ConnectionStatus {
  id: string
  connected: boolean
  error?: string
}

/**
 * 数据库信息
 */
export interface DatabaseInfo {
  name: string
  charset?: string
  collation?: string
}

/**
 * 表信息
 */
export interface TableInfo {
  name: string
  type: string
  rows?: number
  comment?: string
}

/**
 * 字段信息
 */
export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  key: string
  default: string | null
  comment?: string
}

/**
 * 索引信息
 */
export interface IndexInfo {
  name: string
  columns: string[]
  isUnique: boolean
  isPrimary: boolean
  type?: string
}

/**
 * 数据库状态
 */
export interface DBStatus {
  connections: number
  queries: number
  slowQueries: number
  uptime?: number
  version?: string
}

/**
 * 慢查询信息
 */
export interface SlowQuery {
  sql: string
  executionTime: number
  timestamp: number
  schema?: string
}

/**
 * 连接测试结果
 */
export interface TestConnectionResult {
  success: boolean
  error?: string
}

/**
 * 连接结果
 */
export interface ConnectResult {
  success: boolean
  connId?: string
  error?: string
}

/**
 * 暴露给渲染进程的数据库 API
 */
export interface DbApi {
  // 连接管理
  testConnection: (config: ConnectionConfig) => Promise<TestConnectionResult>
  connect: (config: ConnectionConfig) => Promise<ConnectResult>
  disconnect: (connId: string) => Promise<{ success: boolean }>
  listConnections: () => Promise<Array<{ id: string; config: ConnectionConfig }>>
  getConnectionConfig: (connId: string) => Promise<ConnectionConfig | undefined>

  // 数据库操作
  getDatabases: (connId: string) => Promise<string[]>
  getTables: (connId: string, database: string) => Promise<TableInfo[]>
  getColumns: (connId: string, database: string, table: string) => Promise<ColumnInfo[]>
  getIndexes: (connId: string, database: string, table: string) => Promise<IndexInfo[]>

  // 查询和数据操作
  query: (connId: string, sql: string, params?: any[]) => Promise<QueryResult>
  insert: (connId: string, database: string, table: string, data: Record<string, any>[]) => Promise<{ affectedRows: number; insertId: number }>
  update: (connId: string, database: string, table: string, data: Record<string, any>, where: Record<string, any>) => Promise<{ affectedRows: number }>
  delete: (connId: string, database: string, table: string, where: Record<string, any>) => Promise<{ affectedRows: number }>

  // 监控
  getStatus: (connId: string) => Promise<DBStatus>
  getSlowQueries: (connId: string, limit?: number) => Promise<SlowQuery[]>

  // Schema
  getSchema: (connId: string, database: string) => Promise<any>
}

// 扩展 Window 接口
declare global {
  interface Window {
    dbApi: DbApi
  }
}

export {}
