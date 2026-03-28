import type { ConnectionConfig, QueryResult, TableInfo, ColumnInfo, IndexInfo, DBStatus, SlowQuery } from '../types'

/**
 * 统一响应类型
 */
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

function getIpcRenderer() {
  return window.ipcRenderer
}

export const ipcService = {
  // ========== 连接管理 ==========

  /**
   * 测试连接
   */
  async testConnection(config: ConnectionConfig): Promise<{ success: boolean; error?: string }> {
    return getIpcRenderer().invoke('connection:test', config)
  },

  /**
   * 建立数据库连接
   */
  async connect(config: ConnectionConfig): Promise<{ success: boolean; connId?: string; error?: string }> {
    return getIpcRenderer().invoke('connection:connect', config)
  },

  /**
   * 断开数据库连接
   */
  async disconnect(connId: string): Promise<{ success: boolean }> {
    return getIpcRenderer().invoke('connection:disconnect', connId)
  },

  /**
   * 获取活动连接列表
   */
  async listConnections(): Promise<Array<{ id: string; config: ConnectionConfig }>> {
    return getIpcRenderer().invoke('connection:list')
  },

  /**
   * 获取连接配置
   */
  async getConnectionConfig(connId: string): Promise<ConnectionConfig | undefined> {
    return getIpcRenderer().invoke('connection:getConfig', connId)
  },

  // ========== 数据库结构 ==========

  /**
   * 获取数据库列表
   */
  async getDatabases(connId: string): Promise<ApiResponse<string[]>> {
    return getIpcRenderer().invoke('db:getDatabases', connId)
  },

  /**
   * 获取表列表
   */
  async getTables(connId: string, database: string): Promise<ApiResponse<TableInfo[]>> {
    return getIpcRenderer().invoke('db:getTables', connId, database)
  },

  /**
   * 获取列信息
   */
  async getColumns(connId: string, database: string, table: string): Promise<ApiResponse<ColumnInfo[]>> {
    return getIpcRenderer().invoke('db:getColumns', connId, database, table)
  },

  /**
   * 获取索引信息
   */
  async getIndexes(connId: string, database: string, table: string): Promise<ApiResponse<IndexInfo[]>> {
    return getIpcRenderer().invoke('db:getIndexes', connId, database, table)
  },

  // ========== 查询操作 ==========

  /**
   * 执行 SQL 查询
   */
  async query(connId: string, sql: string, params?: any[]): Promise<ApiResponse<QueryResult>> {
    return getIpcRenderer().invoke('db:query', connId, sql, params)
  },

  /**
   * 插入数据
   */
  async insert(connId: string, database: string, table: string, data: Record<string, any>[]): Promise<ApiResponse<{ affectedRows: number; insertId: number }>> {
    return getIpcRenderer().invoke('db:insert', connId, database, table, data)
  },

  /**
   * 更新数据
   */
  async update(connId: string, database: string, table: string, data: Record<string, any>, where: Record<string, any>): Promise<ApiResponse<{ affectedRows: number }>> {
    return getIpcRenderer().invoke('db:update', connId, database, table, data, where)
  },

  /**
   * 删除数据
   */
  async delete(connId: string, database: string, table: string, where: Record<string, any>): Promise<ApiResponse<{ affectedRows: number }>> {
    return getIpcRenderer().invoke('db:delete', connId, database, table, where)
  },

  // ========== 监控 ==========

  /**
   * 获取数据库状态
   */
  async getStatus(connId: string): Promise<ApiResponse<DBStatus>> {
    return getIpcRenderer().invoke('db:getStatus', connId)
  },

  /**
   * 获取慢查询
   */
  async getSlowQueries(connId: string, limit?: number): Promise<ApiResponse<SlowQuery[]>> {
    return getIpcRenderer().invoke('db:getSlowQueries', connId, limit)
  },

  /**
   * 获取 Schema 定义
   */
  async getSchema(connId: string, database: string): Promise<ApiResponse<any>> {
    return getIpcRenderer().invoke('db:getSchema', connId, database)
  }
}
