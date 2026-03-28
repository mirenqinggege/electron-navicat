/**
 * 数据库操作相关 IPC 处理器
 */

import { ipcMain } from 'electron';
import { connectionManager } from '../connection/manager';
import { pluginRegistry } from '../plugins/core/registry';

/**
 * 统一错误响应格式
 */
function errorResponse(error: unknown): { success: false; error: string } {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[IPC] 数据库操作错误:', message);
  return { success: false, error: message };
}

/**
 * 获取连接和插件，如果失败返回错误
 */
async function getConnectionAndPlugin(connId: string) {
  const config = connectionManager.getConfig(connId);
  const connection = connectionManager.getConnection(connId);
  if (!connection || !config) {
    throw new Error(`连接不存在: ${connId}`);
  }
  const plugin = await pluginRegistry.get(config.type);
  return { config, connection, plugin };
}

/**
 * 注册数据库操作相关 IPC 处理器
 */
export function registerDatabaseHandlers(): void {
  // 获取数据库列表
  ipcMain.handle('db:getDatabases', async (_event, connId: string) => {
    console.log('[IPC] db:getDatabases - connId:', connId);
    try {
      const { connection, plugin } = await getConnectionAndPlugin(connId);
      const result = await plugin.getDatabases(connection);
      console.log(`[IPC] db:getDatabases 成功, 获取 ${result.length} 个数据库`);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse(error);
    }
  });

  // 获取表列表
  ipcMain.handle('db:getTables', async (_event, connId: string, database: string) => {
    console.log(`[IPC] db:getTables - connId: ${connId}, database: ${database}`);
    try {
      const { connection, plugin } = await getConnectionAndPlugin(connId);
      const result = await plugin.getTables(connection, database);
      console.log(`[IPC] db:getTables 成功, 获取 ${result.length} 个表`);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse(error);
    }
  });

  // 获取列信息
  ipcMain.handle('db:getColumns', async (_event, connId: string, database: string, table: string) => {
    console.log(`[IPC] db:getColumns - connId: ${connId}, database: ${database}, table: ${table}`);
    try {
      const { connection, plugin } = await getConnectionAndPlugin(connId);
      const result = await plugin.getColumns(connection, database, table);
      console.log(`[IPC] db:getColumns 成功, 获取 ${result.length} 个字段`);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse(error);
    }
  });

  // 获取索引信息
  ipcMain.handle('db:getIndexes', async (_event, connId: string, database: string, table: string) => {
    console.log(`[IPC] db:getIndexes - connId: ${connId}, database: ${database}, table: ${table}`);
    try {
      const { connection, plugin } = await getConnectionAndPlugin(connId);
      const result = await plugin.getIndexes(connection, database, table);
      console.log(`[IPC] db:getIndexes 成功, 获取 ${result.length} 个索引`);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse(error);
    }
  });

  // 执行查询
  ipcMain.handle('db:query', async (_event, connId: string, sql: string, params?: any[]) => {
    console.log(`[IPC] db:query - connId: ${connId}, sql: ${sql.substring(0, 100)}...`);
    try {
      const { connection, plugin } = await getConnectionAndPlugin(connId);
      const result = await plugin.query(connection, sql, params);
      console.log(`[IPC] db:query 成功, 耗时 ${result.executionTime}ms`);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse(error);
    }
  });

  // 插入数据
  ipcMain.handle('db:insert', async (_event, connId: string, database: string, table: string, data: Record<string, any>[]) => {
    console.log(`[IPC] db:insert - connId: ${connId}, database: ${database}, table: ${table}`);
    try {
      const { connection, plugin } = await getConnectionAndPlugin(connId);
      const result = await plugin.insert(connection, database, table, data);
      console.log(`[IPC] db:insert 成功, 影响行数: ${result.affectedRows}`);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse(error);
    }
  });

  // 更新数据
  ipcMain.handle('db:update', async (_event, connId: string, database: string, table: string, data: Record<string, any>, where: Record<string, any>) => {
    console.log(`[IPC] db:update - connId: ${connId}, database: ${database}, table: ${table}`);
    try {
      const { connection, plugin } = await getConnectionAndPlugin(connId);
      const result = await plugin.update(connection, database, table, data, where);
      console.log(`[IPC] db:update 成功, 影响行数: ${result.affectedRows}`);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse(error);
    }
  });

  // 删除数据
  ipcMain.handle('db:delete', async (_event, connId: string, database: string, table: string, where: Record<string, any>) => {
    console.log(`[IPC] db:delete - connId: ${connId}, database: ${database}, table: ${table}`);
    try {
      const { connection, plugin } = await getConnectionAndPlugin(connId);
      const result = await plugin.delete(connection, database, table, where);
      console.log(`[IPC] db:delete 成功, 影响行数: ${result.affectedRows}`);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse(error);
    }
  });

  // 获取数据库状态
  ipcMain.handle('db:getStatus', async (_event, connId: string) => {
    console.log(`[IPC] db:getStatus - connId: ${connId}`);
    try {
      const { connection, plugin } = await getConnectionAndPlugin(connId);
      const result = await plugin.getStatus(connection);
      console.log(`[IPC] db:getStatus 成功`);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse(error);
    }
  });

  // 获取慢查询
  ipcMain.handle('db:getSlowQueries', async (_event, connId: string, limit?: number) => {
    console.log(`[IPC] db:getSlowQueries - connId: ${connId}, limit: ${limit}`);
    try {
      const { connection, plugin } = await getConnectionAndPlugin(connId);
      const result = await plugin.getSlowQueries(connection, limit);
      console.log(`[IPC] db:getSlowQueries 成功, 获取 ${result.length} 条记录`);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse(error);
    }
  });

  // 获取 Schema 定义
  ipcMain.handle('db:getSchema', async (_event, connId: string, database: string) => {
    console.log(`[IPC] db:getSchema - connId: ${connId}, database: ${database}`);
    try {
      const { connection, plugin } = await getConnectionAndPlugin(connId);
      const result = await plugin.getSchemaDefinition(connection, database);
      console.log(`[IPC] db:getSchema 成功`);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse(error);
    }
  });

  console.log('[IPC] 已注册数据库操作处理器');
}
