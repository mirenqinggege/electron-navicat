import { openDB, type IDBPDatabase } from 'idb'
import type { ConnectionConfig } from '../types'

const DB_NAME = 'electron-navicat-db'
const DB_VERSION = 1
const CONNECTIONS_STORE = 'connections'

let dbInstance: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance
  
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(CONNECTIONS_STORE)) {
        const store = db.createObjectStore(CONNECTIONS_STORE, { keyPath: 'id' })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
  
  return dbInstance
}

export const connectionsDB = {
  async getAll(): Promise<ConnectionConfig[]> {
    const db = await getDB()
    return db.getAll(CONNECTIONS_STORE)
  },

  async getById(id: string): Promise<ConnectionConfig | undefined> {
    const db = await getDB()
    return db.get(CONNECTIONS_STORE, id)
  },

  async add(connection: ConnectionConfig): Promise<string> {
    const db = await getDB()
    await db.add(CONNECTIONS_STORE, connection)
    return connection.id
  },

  async update(connection: ConnectionConfig): Promise<void> {
    const db = await getDB()
    await db.put(CONNECTIONS_STORE, connection)
  },

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete(CONNECTIONS_STORE, id)
  },

  async clear(): Promise<void> {
    const db = await getDB()
    await db.clear(CONNECTIONS_STORE)
  }
}

export async function initDB(): Promise<void> {
  await getDB()
}
