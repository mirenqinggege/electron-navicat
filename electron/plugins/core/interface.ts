/**
 * 数据库插件核心接口定义
 */

// 连接配置
export interface ConnectionConfig {
  id: string;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  options?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

// 数据库类型
export type DatabaseType = 'mysql' | 'postgresql' | 'sqlite' | 'sqlserver' | 'oracle';

// 表信息
export interface TableInfo {
  name: string;
  schema?: string;
  type: 'TABLE' | 'VIEW';
  comment?: string;
  rows?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 列信息
export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  comment?: string;
  isPrimaryKey: boolean;
  isAutoIncrement: boolean;
  length?: number;
  precision?: number;
  scale?: number;
}

// 索引信息
export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  isPrimary: boolean;
  type?: string;
}

// 查询结果
export interface QueryResult {
  rows: Record<string, any>[];
  fields: FieldInfo[];
  affectedRows?: number;
  insertId?: number;
  executionTime?: number;
}

// 字段信息
export interface FieldInfo {
  name: string;
  type: string;
  nullable?: boolean;
  length?: number;
}

// 数据库状态
export interface DBStatus {
  connections: number;
  queries: number;
  slowQueries: number;
  uptime?: number;
  version?: string;
}

// 慢查询信息
export interface SlowQuery {
  sql: string;
  executionTime: number;
  timestamp: number;
  schema?: string;
}

// 连接状态
export interface ConnectionStatus {
  id: string;
  connected: boolean;
  error?: string;
}

// Schema 定义（用于对比）
export interface SchemaDef {
  tables: TableInfo[];
  columns: Record<string, ColumnInfo[]>;
  indexes: Record<string, IndexInfo[]>;
}

// Schema 差异
export interface SchemaDiff {
  tables: {
    added: TableInfo[];
    removed: TableInfo[];
    modified: {
      table: TableInfo;
      columns: {
        added: ColumnInfo[];
        removed: ColumnInfo[];
        modified: ColumnInfo[];
      };
      indexes: {
        added: IndexInfo[];
        removed: IndexInfo[];
      };
    }[];
  };
}

/**
 * 数据库插件接口
 * 所有数据库插件必须实现此接口
 */
export interface DatabasePlugin {
  // 插件元信息
  readonly name: DatabaseType;
  readonly displayName: string;
  readonly version: string;

  // 连接管理
  createConnection(config: ConnectionConfig): Promise<any>;
  testConnection(config: ConnectionConfig): Promise<boolean>;
  closeConnection(connection: any): Promise<void>;

  // 结构操作
  getDatabases(connection: any): Promise<string[]>;
  getTables(connection: any, database: string): Promise<TableInfo[]>;
  getColumns(connection: any, database: string, table: string): Promise<ColumnInfo[]>;
  getIndexes(connection: any, database: string, table: string): Promise<IndexInfo[]>;

  // 数据操作
  query(connection: any, sql: string, params?: any[]): Promise<QueryResult>;
  insert(connection: any, database: string, table: string, data: Record<string, any>[]): Promise<{ affectedRows: number; insertId: number }>;
  update(connection: any, database: string, table: string, data: Record<string, any>, where: Record<string, any>): Promise<{ affectedRows: number }>;
  delete(connection: any, database: string, table: string, where: Record<string, any>): Promise<{ affectedRows: number }>;

  // 对比同步
  getSchemaDefinition(connection: any, database: string): Promise<SchemaDef>;
  generateDiff(source: SchemaDef, target: SchemaDef): Promise<SchemaDiff>;
  applyDiff(connection: any, database: string, diff: SchemaDiff): Promise<void>;

  // 监控
  getStatus(connection: any): Promise<DBStatus>;
  getSlowQueries(connection: any, limit?: number): Promise<SlowQuery[]>;
}

/**
 * 插件构造函数类型
 */
export type PluginConstructor = new () => DatabasePlugin;
