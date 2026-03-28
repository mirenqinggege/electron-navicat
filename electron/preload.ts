import { ipcRenderer, contextBridge } from 'electron'

// 暴露给渲染进程的数据库 API
const dbApi = {
  // 连接管理
  testConnection: (config: any) => ipcRenderer.invoke('connection:test', config),
  connect: (config: any) => ipcRenderer.invoke('connection:connect', config),
  disconnect: (connId: string) => ipcRenderer.invoke('connection:disconnect', connId),
  listConnections: () => ipcRenderer.invoke('connection:list'),
  getConnectionConfig: (connId: string) => ipcRenderer.invoke('connection:getConfig', connId),

  // 数据库操作
  getDatabases: (connId: string) => ipcRenderer.invoke('db:getDatabases', connId),
  getTables: (connId: string, database: string) => ipcRenderer.invoke('db:getTables', connId, database),
  getColumns: (connId: string, database: string, table: string) => ipcRenderer.invoke('db:getColumns', connId, database, table),
  getIndexes: (connId: string, database: string, table: string) => ipcRenderer.invoke('db:getIndexes', connId, database, table),

  // 查询和数据操作
  query: (connId: string, sql: string, params?: any[]) => ipcRenderer.invoke('db:query', connId, sql, params),
  insert: (connId: string, database: string, table: string, data: any[]) => ipcRenderer.invoke('db:insert', connId, database, table, data),
  update: (connId: string, database: string, table: string, data: any, where: any) => ipcRenderer.invoke('db:update', connId, database, table, data, where),
  delete: (connId: string, database: string, table: string, where: any) => ipcRenderer.invoke('db:delete', connId, database, table, where),

  // 监控
  getStatus: (connId: string) => ipcRenderer.invoke('db:getStatus', connId),
  getSlowQueries: (connId: string, limit?: number) => ipcRenderer.invoke('db:getSlowQueries', connId, limit),

  // Schema
  getSchema: (connId: string, database: string) => ipcRenderer.invoke('db:getSchema', connId, database),
}

// 暴露给渲染进程
contextBridge.exposeInMainWorld('dbApi', dbApi)

// 保留原有的 ipcRenderer 暴露（用于通用消息）
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})
