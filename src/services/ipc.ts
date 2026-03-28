import type { ConnectionConfig, QueryResult, DatabaseInfo, TableInfo, ColumnInfo } from '../types'

function getIpcRenderer() {
  return window.ipcRenderer
}

export const ipcService = {
  async testConnection(config: ConnectionConfig): Promise<{ success: boolean; error?: string }> {
    return getIpcRenderer().invoke('connection:test', config)
  },

  async saveConnection(config: ConnectionConfig): Promise<void> {
    return getIpcRenderer().invoke('connection:save', config)
  },

  async listConnections(): Promise<ConnectionConfig[]> {
    return getIpcRenderer().invoke('connection:list')
  },

  async deleteConnection(id: string): Promise<void> {
    return getIpcRenderer().invoke('connection:delete', id)
  },

  async dbConnect(id: string): Promise<{ success: boolean; error?: string }> {
    return getIpcRenderer().invoke('db:connect', id)
  },

  async dbDisconnect(id: string): Promise<void> {
    return getIpcRenderer().invoke('db:disconnect', id)
  },

  async dbQuery(connId: string, sql: string): Promise<QueryResult> {
    return getIpcRenderer().invoke('db:query', connId, sql)
  },

  async getDatabases(connId: string): Promise<DatabaseInfo[]> {
    return getIpcRenderer().invoke('db:getDatabases', connId)
  },

  async getTables(connId: string, database: string): Promise<TableInfo[]> {
    return getIpcRenderer().invoke('db:getTables', connId, database)
  },

  async getColumns(connId: string, database: string, table: string): Promise<ColumnInfo[]> {
    return getIpcRenderer().invoke('db:getColumns', connId, database, table)
  }
}
