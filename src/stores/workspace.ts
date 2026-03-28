import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DatabaseInfo, TableInfo, ColumnInfo, QueryResult } from '../types'

export interface SqlHistoryItem {
  id: string
  sql: string
  timestamp: number
  duration?: number
  error?: string
}

export interface QueryTab {
  id: string
  title: string
  sql: string
  result?: QueryResult
  loading: boolean
  error?: string
}

export const useWorkspaceStore = defineStore('workspace', () => {
  // 当前连接信息
  const connId = ref<string>('')
  const currentDatabase = ref<string>('')
  
  // 数据库结构
  const databases = ref<DatabaseInfo[]>([])
  const tables = ref<Map<string, TableInfo[]>>(new Map())
  const columns = ref<Map<string, ColumnInfo[]>>(new Map())
  
  // 加载状态
  const loadingDatabases = ref(false)
  const loadingTables = ref<Map<string, boolean>>(new Map())
  const loadingColumns = ref<Map<string, boolean>>(new Map())
  
  // 查询标签页
  const queryTabs = ref<QueryTab[]>([])
  const activeTabId = ref<string>('')
  
  // SQL 历史
  const sqlHistory = ref<SqlHistoryItem[]>([])
  
  // 计算属性
  const currentTables = computed(() => {
    if (!currentDatabase.value) return []
    return tables.value.get(currentDatabase.value) || []
  })
  
  const activeTab = computed(() => {
    return queryTabs.value.find(tab => tab.id === activeTabId.value)
  })
  
  // 数据库操作
  function setConnId(id: string) {
    connId.value = id
  }
  
  function setCurrentDatabase(db: string) {
    currentDatabase.value = db
  }
  
  function setDatabases(list: DatabaseInfo[]) {
    databases.value = list
  }
  
  function setTables(database: string, list: TableInfo[]) {
    tables.value.set(database, list)
  }
  
  function setColumns(tableKey: string, list: ColumnInfo[]) {
    columns.value.set(tableKey, list)
  }
  
  function setLoadingDatabases(loading: boolean) {
    loadingDatabases.value = loading
  }
  
  function setLoadingTables(database: string, loading: boolean) {
    loadingTables.value.set(database, loading)
  }
  
  function setLoadingColumns(tableKey: string, loading: boolean) {
    loadingColumns.value.set(tableKey, loading)
  }
  
  // 标签页操作
  function addQueryTab(title?: string) {
    const id = `tab-${Date.now()}`
    const tab: QueryTab = {
      id,
      title: title || `查询 ${queryTabs.value.length + 1}`,
      sql: '',
      loading: false
    }
    queryTabs.value.push(tab)
    activeTabId.value = id
    return tab
  }
  
  function removeQueryTab(id: string) {
    const index = queryTabs.value.findIndex(tab => tab.id === id)
    if (index !== -1) {
      queryTabs.value.splice(index, 1)
      if (activeTabId.value === id && queryTabs.value.length > 0) {
        activeTabId.value = queryTabs.value[Math.max(0, index - 1)].id
      }
    }
  }
  
  function setActiveTab(id: string) {
    activeTabId.value = id
  }
  
  function updateTabSql(id: string, sql: string) {
    const tab = queryTabs.value.find(t => t.id === id)
    if (tab) {
      tab.sql = sql
    }
  }
  
  function updateTabResult(id: string, result?: QueryResult) {
    const tab = queryTabs.value.find(t => t.id === id)
    if (tab) {
      tab.result = result
      tab.error = undefined
    }
  }
  
  function updateTabError(id: string, error: string) {
    const tab = queryTabs.value.find(t => t.id === id)
    if (tab) {
      tab.error = error
      tab.result = undefined
    }
  }
  
  function updateTabLoading(id: string, loading: boolean) {
    const tab = queryTabs.value.find(t => t.id === id)
    if (tab) {
      tab.loading = loading
    }
  }
  
  // SQL 历史
  function addSqlHistory(item: SqlHistoryItem) {
    sqlHistory.value.unshift(item)
    // 保留最近 100 条
    if (sqlHistory.value.length > 100) {
      sqlHistory.value = sqlHistory.value.slice(0, 100)
    }
  }
  
  function clearSqlHistory() {
    sqlHistory.value = []
  }
  
  // 重置
  function reset() {
    connId.value = ''
    currentDatabase.value = ''
    databases.value = []
    tables.value.clear()
    columns.value.clear()
    queryTabs.value = []
    activeTabId.value = ''
    sqlHistory.value = []
  }
  
  return {
    // 状态
    connId,
    currentDatabase,
    databases,
    tables,
    columns,
    loadingDatabases,
    loadingTables,
    loadingColumns,
    queryTabs,
    activeTabId,
    sqlHistory,
    
    // 计算属性
    currentTables,
    activeTab,
    
    // 数据库操作
    setConnId,
    setCurrentDatabase,
    setDatabases,
    setTables,
    setColumns,
    setLoadingDatabases,
    setLoadingTables,
    setLoadingColumns,
    
    // 标签页操作
    addQueryTab,
    removeQueryTab,
    setActiveTab,
    updateTabSql,
    updateTabResult,
    updateTabError,
    updateTabLoading,
    
    // SQL 历史
    addSqlHistory,
    clearSqlHistory,
    
    // 重置
    reset
  }
})
