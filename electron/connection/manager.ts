/**
 * 连接管理器
 * 管理数据库连接的生命周期
 */

import { ConnectionConfig } from '../plugins/core/interface';
import { pluginRegistry } from '../plugins/core/registry';

// 活动连接
interface ActiveConnection {
  id: string;
  config: ConnectionConfig;
  connection: any;
  createdAt: number;
  lastUsedAt: number;
}

/**
 * 连接管理器类
 */
export class ConnectionManager {
  private connections: Map<string, ActiveConnection> = new Map();

  /**
   * 创建新连接
   */
  async connect(config: ConnectionConfig): Promise<string> {
    // 检查是否已存在连接
    const existing = this.findConnection(config);
    if (existing) {
      existing.lastUsedAt = Date.now();
      return existing.id;
    }

    // 获取插件
    const plugin = await pluginRegistry.get(config.type);

    // 创建连接
    try {
      const connection = await plugin.createConnection(config);
      const id = this.generateId();

      this.connections.set(id, {
        id,
        config,
        connection,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      });

      console.log(`[ConnectionManager] 已创建连接: ${id} (${config.name})`);
      return id;
    } catch (error) {
      console.error(`[ConnectionManager] 创建连接失败:`, error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(connId: string): Promise<void> {
    const active = this.connections.get(connId);
    if (!active) {
      return;
    }

    const plugin = await pluginRegistry.get(active.config.type);
    await plugin.closeConnection(active.connection);
    this.connections.delete(connId);

    console.log(`[ConnectionManager] 已断开连接: ${connId}`);
  }

  /**
   * 测试连接
   */
  async testConnection(config: ConnectionConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const plugin = await pluginRegistry.get(config.type);
      const success = await plugin.testConnection(config);
      return { success };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取连接
   */
  getConnection(connId: string): any | undefined {
    const active = this.connections.get(connId);
    if (active) {
      active.lastUsedAt = Date.now();
      return active.connection;
    }
    return undefined;
  }

  /**
   * 获取连接配置
   */
  getConfig(connId: string): ConnectionConfig | undefined {
    const active = this.connections.get(connId);
    return active?.config;
  }

  /**
   * 获取所有活动连接
   */
  getAllConnections(): Array<{ id: string; config: ConnectionConfig }> {
    return Array.from(this.connections.values()).map((active) => ({
      id: active.id,
      config: active.config,
    }));
  }

  /**
   * 检查连接是否存在
   */
  hasConnection(connId: string): boolean {
    return this.connections.has(connId);
  }

  /**
   * 断开所有连接
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.connections.keys()).map((id) => this.disconnect(id));
    await Promise.all(promises);
    console.log('[ConnectionManager] 已断开所有连接');
  }

  /**
   * 生成连接 ID
   */
  private generateId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 查找已存在的连接
   */
  private findConnection(config: ConnectionConfig): ActiveConnection | undefined {
    for (const active of this.connections.values()) {
      if (
        active.config.type === config.type &&
        active.config.host === config.host &&
        active.config.port === config.port &&
        active.config.database === config.database &&
        active.config.username === config.username
      ) {
        return active;
      }
    }
    return undefined;
  }
}

// 导出单例实例
export const connectionManager = new ConnectionManager();
