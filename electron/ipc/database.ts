/**
 * 数据库操作相关 IPC 处理器
 */

import { ipcMain } from 'electron';
import { connectionManager } from '../connection/manager';
import { pluginRegistry } from '../plugins/core/registry';

/**
 * 注册数据库操作相关 IPC 处理器
 */
export function registerDatabaseHandlers(): void {
  // 获取数据库列表
  ipcMain.handle('db:getDatabases', async (_event, connId: string) => {
    const config = connectionManager.getConfig(connId);
    const connection = connectionManager.getConnection(connId);
    if (!connection || !config) {
      throw new Error('连接不存在');
    }

    const plugin = await pluginRegistry.get(config.type);
    return await plugin.getDatabases(connection);
  });

  // 获取表列表
  ipcMain.handle('db:getTables', async (_event, connId: string, database: string) => {
    const config = connectionManager.getConfig(connId);
    const connection = connectionManager.getConnection(connId);
    if (!connection || !config) {
      throw new Error('连接不存在');
    }

    const plugin = await pluginRegistry.get(config.type);
    return await plugin.getTables(connection, database);
  });

  // 获取列信息
  ipcMain.handle('db:getColumns', async (_event, connId: string, database: string, table: string) => {
    const config = connectionManager.getConfig(connId);
    const connection = connectionManager.getConnection(connId);
    if (!connection || !config) {
      throw new Error('连接不存在');
    }

    const plugin = await pluginRegistry.get(config.type);
    return await plugin.getColumns(connection, database, table);
  });

  // 获取索引信息
  ipcMain.handle('db:getIndexes', async (_event, connId: string, database: string, table: string) => {
    const config = connectionManager.getConfig(connId);
    const connection = connectionManager.getConnection(connId);
    if (!connection || !config) {
      throw new Error('连接不存在');
    }

    const plugin = await pluginRegistry.get(config.type);
    return await plugin.getIndexes(connection, database, table);
  });

  // 执行查询
  ipcMain.handle('db:query', async (_event, connId: string, sql: string, params?: any[]) => {
    const config = connectionManager.getConfig(connId);
    const connection = connectionManager.getConnection(connId);
    if (!connection || !config) {
      throw new Error('连接不存在');
    }

    const plugin = await pluginRegistry.get(config.type);
    return await plugin.query(connection, sql, params);
  });

  // 插入数据
  ipcMain.handle('db:insert', async (_event, connId: string, database: string, table: string, data: Record<string, any>[]) => {
    const config = connectionManager.getConfig(connId);
    const connection = connectionManager.getConnection(connId);
    if (!connection || !config) {
      throw new Error('连接不存在');
    }

    const plugin = await pluginRegistry.get(config.type);
    return await plugin.insert(connection, database, table, data);
  });

  // 更新数据
  ipcMain.handle('db:update', async (_event, connId: string, database: string, table: string, data: Record<string, any>, where: Record<string, any>) => {
    const config = connectionManager.getConfig(connId);
    const connection = connectionManager.getConnection(connId);
    if (!connection || !config) {
      throw new Error('连接不存在');
    }

    const plugin = await pluginRegistry.get(config.type);
    return await plugin.update(connection, database, table, data, where);
  });

  // 删除数据
  ipcMain.handle('db:delete', async (_event, connId: string, database: string, table: string, where: Record<string, any>) => {
    const config = connectionManager.getConfig(connId);
    const connection = connectionManager.getConnection(connId);
    if (!connection || !config) {
      throw new Error('连接不存在');
    }

    const plugin = await pluginRegistry.get(config.type);
    return await plugin.delete(connection, database, table, where);
  });

  // 获取数据库状态
  ipcMain.handle('db:getStatus', async (_event, connId: string) => {
    const config = connectionManager.getConfig(connId);
    const connection = connectionManager.getConnection(connId);
    if (!connection || !config) {
      throw new Error('连接不存在');
    }

    const plugin = await pluginRegistry.get(config.type);
    return await plugin.getStatus(connection);
  });

  // 获取慢查询
  ipcMain.handle('db:getSlowQueries', async (_event, connId: string, limit?: number) => {
    const config = connectionManager.getConfig(connId);
    const connection = connectionManager.getConnection(connId);
    if (!connection || !config) {
      throw new Error('连接不存在');
    }

    const plugin = await pluginRegistry.get(config.type);
    return await plugin.getSlowQueries(connection, limit);
  });

  // 获取 Schema 定义
  ipcMain.handle('db:getSchema', async (_event, connId: string, database: string) => {
    const config = connectionManager.getConfig(connId);
    const connection = connectionManager.getConnection(connId);
    if (!connection || !config) {
      throw new Error('连接不存在');
    }

    const plugin = await pluginRegistry.get(config.type);
    return await plugin.getSchemaDefinition(connection, database);
  });

  console.log('[IPC] 已注册数据库操作处理器');
}
