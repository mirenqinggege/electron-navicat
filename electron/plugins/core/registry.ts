/**
 * 插件注册表
 * 管理插件的注册和获取
 */

import { DatabasePlugin, DatabaseType } from './interface';
import { pluginLoader } from './loader';

/**
 * 插件注册表类
 */
export class PluginRegistry {
  private plugins: Map<DatabaseType, DatabasePlugin> = new Map();

  /**
   * 注册插件
   */
  register(plugin: DatabasePlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[PluginRegistry] 插件 ${plugin.name} 已注册，将被覆盖`);
    }
    this.plugins.set(plugin.name, plugin);
    console.log(`[PluginRegistry] 已注册插件: ${plugin.displayName}`);
  }

  /**
   * 获取插件
   */
  async get(type: DatabaseType): Promise<DatabasePlugin> {
    // 先检查本地缓存
    if (this.plugins.has(type)) {
      return this.plugins.get(type)!;
    }

    // 尝试从加载器加载
    const plugin = await pluginLoader.load(type);
    this.plugins.set(type, plugin);
    return plugin;
  }

  /**
   * 检查插件是否存在
   */
  has(type: DatabaseType): boolean {
    return this.plugins.has(type) || pluginLoader.has(type);
  }

  /**
   * 获取所有已注册的插件
   */
  getAll(): Map<DatabaseType, DatabasePlugin> {
    return this.plugins;
  }

  /**
   * 注销插件
   */
  unregister(type: DatabaseType): boolean {
    return this.plugins.delete(type);
  }

  /**
   * 清空所有插件
   */
  clear(): void {
    this.plugins.clear();
  }
}

// 导出单例实例
export const pluginRegistry = new PluginRegistry();
