/**
 * 插件加载器
 * 负责发现和加载数据库插件
 */

import { DatabasePlugin, PluginConstructor, DatabaseType } from './interface';

// 内置插件映射
const builtinPlugins: Record<string, () => Promise<PluginConstructor>> = {
  mysql: () => import('../mysql').then(m => m.MySQLPlugin),
  // postgresql: () => import('../postgresql').then(m => m.PostgreSQLPlugin),
  // sqlite: () => import('../sqlite').then(m => m.SQLitePlugin),
};

/**
 * 插件加载器类
 */
export class PluginLoader {
  private loadedPlugins: Map<DatabaseType, DatabasePlugin> = new Map();

  /**
   * 加载指定类型的插件
   */
  async load(type: DatabaseType): Promise<DatabasePlugin> {
    // 检查是否已加载
    if (this.loadedPlugins.has(type)) {
      return this.loadedPlugins.get(type)!;
    }

    // 查找内置插件
    const loader = builtinPlugins[type];
    if (!loader) {
      throw new Error(`不支持的数据库类型: ${type}`);
    }

    // 加载插件
    const PluginClass = await loader();
    const plugin = new PluginClass();
    this.loadedPlugins.set(type, plugin);

    console.log(`[PluginLoader] 已加载插件: ${plugin.displayName} v${plugin.version}`);
    return plugin;
  }

  /**
   * 加载所有内置插件
   */
  async loadAll(): Promise<Map<DatabaseType, DatabasePlugin>> {
    for (const type of Object.keys(builtinPlugins) as DatabaseType[]) {
      try {
        await this.load(type);
      } catch (error) {
        console.error(`[PluginLoader] 加载插件 ${type} 失败:`, error);
      }
    }
    return this.loadedPlugins;
  }

  /**
   * 获取已加载的插件
   */
  get(type: DatabaseType): DatabasePlugin | undefined {
    return this.loadedPlugins.get(type);
  }

  /**
   * 获取所有已加载的插件
   */
  getAll(): Map<DatabaseType, DatabasePlugin> {
    return this.loadedPlugins;
  }

  /**
   * 检查插件是否已加载
   */
  has(type: DatabaseType): boolean {
    return this.loadedPlugins.has(type);
  }

  /**
   * 获取支持的数据库类型列表
   */
  getSupportedTypes(): DatabaseType[] {
    return Object.keys(builtinPlugins) as DatabaseType[];
  }
}

// 导出单例实例
export const pluginLoader = new PluginLoader();
