/**
 * 连接相关 IPC 处理器
 */

import { ipcMain } from 'electron';
import { connectionManager } from '../connection/manager';
import { ConnectionConfig } from '../plugins/core/interface';

/**
 * 注册连接相关 IPC 处理器
 */
export function registerConnectionHandlers(): void {
  // 测试连接
  ipcMain.handle('connection:test', async (_event, config: ConnectionConfig) => {
    return await connectionManager.testConnection(config);
  });

  // 建立连接
  ipcMain.handle('connection:connect', async (_event, config: ConnectionConfig) => {
    try {
      const connId = await connectionManager.connect(config);
      return { success: true, connId };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 断开连接
  ipcMain.handle('connection:disconnect', async (_event, connId: string) => {
    await connectionManager.disconnect(connId);
    return { success: true };
  });

  // 获取活动连接列表
  ipcMain.handle('connection:list', async () => {
    return connectionManager.getAllConnections();
  });

  // 获取连接配置
  ipcMain.handle('connection:getConfig', async (_event, connId: string) => {
    return connectionManager.getConfig(connId);
  });

  console.log('[IPC] 已注册连接处理器');
}
