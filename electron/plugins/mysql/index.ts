/**
 * MySQL/MariaDB 数据库插件
 */

import {
  DatabasePlugin,
  ConnectionConfig,
  TableInfo,
  ColumnInfo,
  IndexInfo,
  QueryResult,
  DBStatus,
  SlowQuery,
  SchemaDef,
  SchemaDiff,
} from '../core/interface';
import * as mysql from 'mysql2/promise';

/**
 * MySQL 插件实现
 */
export class MySQLPlugin implements DatabasePlugin {
  readonly name = 'mysql' as const;
  readonly displayName = 'MySQL / MariaDB';
  readonly version = '1.0.0';

  /**
   * 创建数据库连接
   */
  async createConnection(config: ConnectionConfig): Promise<mysql.Connection> {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      ...config.options,
    });
    return connection;
  }

  /**
   * 测试连接
   */
  async testConnection(config: ConnectionConfig): Promise<boolean> {
    let connection: mysql.Connection | null = null;
    try {
      connection = await this.createConnection(config);
      await connection.ping();
      return true;
    } catch (error: any) {
      console.error('[MySQLPlugin] 连接测试失败:', error);
      // 抛出错误，让上层捕获错误信息
      throw new Error(error.message || '连接失败');
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

  /**
   * 关闭连接
   */
  async closeConnection(connection: mysql.Connection): Promise<void> {
    await connection.end();
  }

  /**
   * 获取数据库列表
   */
  async getDatabases(connection: mysql.Connection): Promise<string[]> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SHOW DATABASES'
    );
    return rows
      .map((row) => row.Database)
      .filter((db) => !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(db));
  }

  /**
   * 获取表列表
   */
  async getTables(connection: mysql.Connection, database: string): Promise<TableInfo[]> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT
        TABLE_NAME as name,
        TABLE_TYPE as type,
        TABLE_COMMENT as comment,
        TABLE_ROWS as \`rows\`,
        CREATE_TIME as createdAt,
        UPDATE_TIME as updatedAt
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?`,
      [database]
    );

    return rows.map((row) => ({
      name: row.name,
      type: row.type === 'VIEW' ? 'VIEW' : 'TABLE',
      comment: row.comment || undefined,
      rows: row.rows || 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * 获取列信息
   */
  async getColumns(connection: mysql.Connection, database: string, table: string): Promise<ColumnInfo[]> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT
        COLUMN_NAME as name,
        COLUMN_TYPE as type,
        IS_NULLABLE as nullable,
        COLUMN_DEFAULT as defaultValue,
        COLUMN_COMMENT as comment,
        COLUMN_KEY as columnKey,
        EXTRA as extra
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION`,
      [database, table]
    );

    return rows.map((row) => ({
      name: row.name,
      type: row.type,
      nullable: row.nullable === 'YES',
      defaultValue: row.defaultValue,
      comment: row.comment || undefined,
      isPrimaryKey: row.columnKey === 'PRI',
      isAutoIncrement: row.extra?.includes('auto_increment') || false,
    }));
  }

  /**
   * 获取索引信息
   */
  async getIndexes(connection: mysql.Connection, database: string, table: string): Promise<IndexInfo[]> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT
        INDEX_NAME as indexName,
        COLUMN_NAME as columnName,
        NON_UNIQUE as nonUnique,
        INDEX_TYPE as indexType
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
      [database, table]
    );

    // 按索引名分组
    const indexMap = new Map<string, IndexInfo>();

    for (const row of rows) {
      const existing = indexMap.get(row.indexName);
      if (existing) {
        existing.columns.push(row.columnName);
      } else {
        indexMap.set(row.indexName, {
          name: row.indexName,
          columns: [row.columnName],
          isUnique: row.nonUnique === 0,
          isPrimary: row.indexName === 'PRIMARY',
          type: row.indexType,
        });
      }
    }

    return Array.from(indexMap.values());
  }

  /**
   * 执行查询
   */
  async query(connection: mysql.Connection, sql: string, params?: any[]): Promise<QueryResult> {
    const startTime = Date.now();
    const [result, fields] = await connection.query(sql, params);
    const executionTime = Date.now() - startTime;

    // 判断是 SELECT 还是其他语句
    if (Array.isArray(result)) {
      return {
        rows: result as Record<string, any>[],
        fields: (fields || []).map((f) => ({
          name: f.name,
          type: String(f.type),
          nullable: f.flags === 0,
          length: f.length,
        })),
        executionTime,
      };
    } else {
      const resultSet = result as mysql.ResultSetHeader;
      return {
        rows: [],
        fields: [],
        affectedRows: resultSet.affectedRows,
        insertId: resultSet.insertId,
        executionTime,
      };
    }
  }

  /**
   * 插入数据
   */
  async insert(
    connection: mysql.Connection,
    database: string,
    table: string,
    data: Record<string, any>[]
  ): Promise<{ affectedRows: number; insertId: number }> {
    if (data.length === 0) {
      return { affectedRows: 0, insertId: 0 };
    }

    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO \`${database}\`.\`${table}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;

    let totalAffected = 0;
    let lastInsertId = 0;

    for (const row of data) {
      const values = columns.map((col) => row[col]);
      const [result] = await connection.query<mysql.ResultSetHeader>(sql, values);
      totalAffected += result.affectedRows;
      lastInsertId = result.insertId;
    }

    return { affectedRows: totalAffected, insertId: lastInsertId };
  }

  /**
   * 更新数据
   */
  async update(
    connection: mysql.Connection,
    database: string,
    table: string,
    data: Record<string, any>,
    where: Record<string, any>
  ): Promise<{ affectedRows: number }> {
    const setClauses = Object.keys(data).map((key) => `\`${key}\` = ?`);
    const whereClauses = Object.keys(where).map((key) => `\`${key}\` = ?`);

    const sql = `UPDATE \`${database}\`.\`${table}\` SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;
    const values = [...Object.values(data), ...Object.values(where)];

    const [result] = await connection.query<mysql.ResultSetHeader>(sql, values);
    return { affectedRows: result.affectedRows };
  }

  /**
   * 删除数据
   */
  async delete(
    connection: mysql.Connection,
    database: string,
    table: string,
    where: Record<string, any>
  ): Promise<{ affectedRows: number }> {
    const whereClauses = Object.keys(where).map((key) => `\`${key}\` = ?`);
    const sql = `DELETE FROM \`${database}\`.\`${table}\` WHERE ${whereClauses.join(' AND ')}`;
    const values = Object.values(where);

    const [result] = await connection.query<mysql.ResultSetHeader>(sql, values);
    return { affectedRows: result.affectedRows };
  }

  /**
   * 获取 Schema 定义
   */
  async getSchemaDefinition(connection: mysql.Connection, database: string): Promise<SchemaDef> {
    const tables = await this.getTables(connection, database);
    const columns: Record<string, ColumnInfo[]> = {};
    const indexes: Record<string, IndexInfo[]> = {};

    for (const table of tables) {
      columns[table.name] = await this.getColumns(connection, database, table.name);
      indexes[table.name] = await this.getIndexes(connection, database, table.name);
    }

    return { tables, columns, indexes };
  }

  /**
   * 生成 Schema 差异
   */
  async generateDiff(source: SchemaDef, target: SchemaDef): Promise<SchemaDiff> {
    const diff: SchemaDiff = {
      tables: {
        added: [],
        removed: [],
        modified: [],
      },
    };

    const sourceTableNames = new Set(source.tables.map((t) => t.name));
    const targetTableNames = new Set(target.tables.map((t) => t.name));

    // 新增的表
    diff.tables.added = source.tables.filter((t) => !targetTableNames.has(t.name));

    // 删除的表
    diff.tables.removed = target.tables.filter((t) => !sourceTableNames.has(t.name));

    // 修改的表
    for (const sourceTable of source.tables) {
      if (targetTableNames.has(sourceTable.name)) {
        const sourceColumns = source.columns[sourceTable.name] || [];
        const targetColumns = target.columns[sourceTable.name] || [];
        const sourceIndexes = source.indexes[sourceTable.name] || [];
        const targetIndexes = target.indexes[sourceTable.name] || [];

        const columnDiff = this.diffColumns(sourceColumns, targetColumns);
        const indexDiff = this.diffIndexes(sourceIndexes, targetIndexes);

        if (columnDiff.added.length > 0 || columnDiff.removed.length > 0 || columnDiff.modified.length > 0 ||
            indexDiff.added.length > 0 || indexDiff.removed.length > 0) {
          diff.tables.modified.push({
            table: sourceTable,
            columns: columnDiff,
            indexes: indexDiff,
          });
        }
      }
    }

    return diff;
  }

  /**
   * 比较列差异
   */
  private diffColumns(source: ColumnInfo[], target: ColumnInfo[]): {
    added: ColumnInfo[];
    removed: ColumnInfo[];
    modified: ColumnInfo[];
  } {
    const sourceMap = new Map(source.map((c) => [c.name, c]));
    const targetMap = new Map(target.map((c) => [c.name, c]));

    const added: ColumnInfo[] = [];
    const removed: ColumnInfo[] = [];
    const modified: ColumnInfo[] = [];

    for (const [name, col] of sourceMap) {
      if (!targetMap.has(name)) {
        added.push(col);
      } else {
        const targetCol = targetMap.get(name)!;
        if (col.type !== targetCol.type || col.nullable !== targetCol.nullable) {
          modified.push(col);
        }
      }
    }

    for (const [name, col] of targetMap) {
      if (!sourceMap.has(name)) {
        removed.push(col);
      }
    }

    return { added, removed, modified };
  }

  /**
   * 比较索引差异
   */
  private diffIndexes(source: IndexInfo[], target: IndexInfo[]): {
    added: IndexInfo[];
    removed: IndexInfo[];
  } {
    const sourceMap = new Map(source.map((i) => [i.name, i]));
    const targetMap = new Map(target.map((i) => [i.name, i]));

    const added: IndexInfo[] = [];
    const removed: IndexInfo[] = [];

    for (const [name, idx] of sourceMap) {
      if (!targetMap.has(name)) {
        added.push(idx);
      }
    }

    for (const [name, idx] of targetMap) {
      if (!sourceMap.has(name)) {
        removed.push(idx);
      }
    }

    return { added, removed };
  }

  /**
   * 应用 Schema 差异
   */
  async applyDiff(connection: mysql.Connection, database: string, diff: SchemaDiff): Promise<void> {
    // 创建新表
    for (const table of diff.tables.added) {
      // TODO: 实现建表逻辑
      console.log(`[MySQLPlugin] 创建表: ${table.name}`);
    }

    // 删除表
    for (const table of diff.tables.removed) {
      await connection.query(`DROP TABLE IF EXISTS \`${database}\`.\`${table.name}\``);
    }

    // 修改表
    for (const mod of diff.tables.modified) {
      // TODO: 实现修改表逻辑
      console.log(`[MySQLPlugin] 修改表: ${mod.table.name}`);
    }
  }

  /**
   * 获取数据库状态
   */
  async getStatus(connection: mysql.Connection): Promise<DBStatus> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SHOW STATUS WHERE Variable_name IN (
        'Threads_connected',
        'Queries',
        'Slow_queries',
        'Uptime',
        'Version'
      )`
    );

    const statusMap = new Map(rows.map((r) => [r.Variable_name, r.Value]));

    return {
      connections: parseInt(statusMap.get('Threads_connected') || '0', 10),
      queries: parseInt(statusMap.get('Queries') || '0', 10),
      slowQueries: parseInt(statusMap.get('Slow_queries') || '0', 10),
      uptime: parseInt(statusMap.get('Uptime') || '0', 10),
      version: statusMap.get('Version'),
    };
  }

  /**
   * 获取慢查询
   */
  async getSlowQueries(connection: mysql.Connection, limit: number = 10): Promise<SlowQuery[]> {
    // MySQL 需要启用慢查询日志，这里返回基本信息
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT ?`,
      [limit]
    ).catch(() => [[], []]); // 如果慢查询日志未启用，返回空数组

    return (rows as mysql.RowDataPacket[]).map((row) => ({
      sql: row.sql_text,
      executionTime: row.query_time,
      timestamp: new Date(row.start_time).getTime(),
      schema: row.db,
    }));
  }
}
