<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { TreeProps } from 'ant-design-vue'
import { ipcService } from '../../services/ipc'
import { useWorkspaceStore } from '../../stores/workspace'
const store = useWorkspaceStore()

const searchValue = ref('')
const expandedKeys = ref<string[]>([])
const selectedKeys = ref<string[]>([])
const treeData = ref<TreeProps['treeData']>([])
const loading = ref(false)

// 将数据库结构转换为树形数据
function buildTreeData(): TreeProps['treeData'] {
  return store.databases.map(db => {
    const tables = store.tables.get(db)
    // 如果表还没加载，添加一个占位符来显示展开箭头
    const children = tables ? buildTableChildren(db) : [{ key: `db-${db}-placeholder`, title: '点击展开加载...', isLeaf: true }]
    
    return {
      key: `db-${db}`,
      title: db,
      icon: 'database',
      children
    }
  })
}

function buildTableChildren(dbName: string): TreeProps['treeData'] {
  const tables = store.tables.get(dbName) || []
  if (tables.length === 0) return []
  
  return tables.map(table => {
    const tableKey = `${dbName}.${table.name}`
    const columns = store.columns.get(tableKey)
    // 如果字段还没加载，添加一个占位符来显示展开箭头
    const children = columns ? buildColumnChildren(dbName, table.name) : [{ key: `table-${dbName}-${table.name}-placeholder`, title: '点击展开加载...', isLeaf: true }]
    
    return {
      key: `table-${dbName}-${table.name}`,
      title: table.name,
      icon: 'table',
      children
    }
  })
}

function buildColumnChildren(dbName: string, tableName: string): TreeProps['treeData'] {
  const tableKey = `${dbName}.${tableName}`
  const columns = store.columns.get(tableKey) || []
  return columns.map(col => {
    // 兼容两种数据格式：
    // - 后端返回: { isPrimaryKey: boolean }
    // - 前端期望: { key: 'PRI' | '' }
    const isPrimaryKey = (col as any).isPrimaryKey === true || col.key === 'PRI'
    
    return {
      key: `col-${dbName}-${tableName}-${col.name}`,
      title: `${col.name} (${col.type})`,
      icon: isPrimaryKey ? 'key' : col.nullable ? 'column' : 'column-height',
      isLeaf: true
    }
  })
}

// 加载数据库列表
async function loadDatabases() {
  if (!store.connId) return

  loading.value = true
  store.setLoadingDatabases(true)

  try {
    const response = await ipcService.getDatabases(store.connId)
    if (response.success && response.data) {
      store.setDatabases(response.data.map(name => ({ name })))
      treeData.value = buildTreeData()
    } else {
      throw new Error(response.error || '加载失败')
    }
  } catch (error) {
    message.error('加载数据库列表失败')
    console.error(error)
  } finally {
    loading.value = false
    store.setLoadingDatabases(false)
  }
}

// 加载表列表
async function loadTables(dbName: string) {
  if (!store.connId) return

  console.log('[SchemaTree] loadTables called, connId:', store.connId, 'dbName:', dbName)
  store.setLoadingTables(dbName, true)

  try {
    const response = await ipcService.getTables(store.connId, dbName)
    console.log('[SchemaTree] getTables response:', response)
    if (response.success && response.data) {
      store.setTables(dbName, response.data)
      treeData.value = buildTreeData()
      console.log('[SchemaTree] Tables set in store, treeData rebuilt')
    } else {
      throw new Error(response.error || '加载失败')
    }
  } catch (error) {
    message.error(`加载 ${dbName} 的表列表失败`)
    console.error('[SchemaTree] loadTables error:', error)
  } finally {
    store.setLoadingTables(dbName, false)
  }
}

// 加载字段列表
async function loadColumns(dbName: string, tableName: string) {
  if (!store.connId) return

  const tableKey = `${dbName}.${tableName}`
  store.setLoadingColumns(tableKey, true)

  try {
    const response = await ipcService.getColumns(store.connId, dbName, tableName)
    if (response.success && response.data) {
      store.setColumns(tableKey, response.data)
      treeData.value = buildTreeData()
    } else {
      throw new Error(response.error || '加载失败')
    }
  } catch (error) {
    message.error(`加载 ${tableName} 的字段列表失败`)
    console.error(error)
  } finally {
    store.setLoadingColumns(tableKey, false)
  }
}

// 树节点展开时加载数据
async function handleExpand(keys: string[]) {
  console.log('[SchemaTree] handleExpand called, keys:', keys)
  expandedKeys.value = keys
  
  for (const key of keys) {
    console.log('[SchemaTree] Processing key:', key)
    if (key.startsWith('db-')) {
      const dbName = key.replace('db-', '')
      console.log('[SchemaTree] Loading tables for db:', dbName, 'already loaded:', store.tables.has(dbName))
      if (!store.tables.has(dbName)) {
        await loadTables(dbName)
        console.log('[SchemaTree] Tables loaded for', dbName, 'count:', store.tables.get(dbName)?.length)
      }
    } else if (key.startsWith('table-')) {
      const parts = key.split('-')
      const dbName = parts[1]
      const tableName = parts[2]
      const tableKey = `${dbName}.${tableName}`
      console.log('[SchemaTree] Loading columns for table:', tableKey, 'already loaded:', store.columns.has(tableKey))
      if (!store.columns.has(tableKey)) {
        await loadColumns(dbName, tableName)
        console.log('[SchemaTree] Columns loaded for', tableKey, 'count:', store.columns.get(tableKey)?.length)
      }
    }
  }
}

// 选择节点
function handleSelect(keys: string[]) {
  selectedKeys.value = keys
  
  if (keys.length === 0) return
  
  const key = keys[0]
  if (key.startsWith('db-')) {
    const dbName = key.replace('db-', '')
    store.setCurrentDatabase(dbName)
  } else if (key.startsWith('table-')) {
    const [, dbName] = key.split('-')
    store.setCurrentDatabase(dbName)
    // 可以在这里触发表数据加载
  }
}

// 搜索过滤
function filterTree(node: any): boolean {
  if (!searchValue.value) return true
  const title = node.title?.toString().toLowerCase() || ''
  return title.includes(searchValue.value.toLowerCase())
}

// 监听数据库变化重新构建树
watch(() => store.databases, () => {
  treeData.value = buildTreeData()
}, { deep: true })

// 监听 connId 变化
watch(() => store.connId, (newId, oldId) => {
  console.log('[SchemaTree] connId 变化:', { oldId, newId })
  if (newId && newId !== oldId) {
    loadDatabases()
  }
})

onMounted(() => {
  console.log('[SchemaTree] onMounted, connId =', store.connId)
  if (store.connId) {
    loadDatabases()
  }
})
</script>

<template>
  <div class="schema-tree">
    <div class="schema-tree-header">
      <a-input-search
        v-model:value="searchValue"
        placeholder="搜索表或字段"
        style="margin-bottom: 8px"
      />
    </div>
    
    <a-spin :spinning="loading">
      <a-tree
        v-if="treeData && treeData.length > 0"
        :tree-data="treeData"
        :expanded-keys="expandedKeys"
        :selected-keys="selectedKeys"
        :show-icon="false"
        :filter-tree-node="filterTree"
        @expand="handleExpand"
        @select="handleSelect"
      >
        <template #title="{ title, icon }">
          <span class="tree-node">
            <database-outlined v-if="icon === 'database'" class="tree-icon" />
            <table-outlined v-else-if="icon === 'table'" class="tree-icon" />
            <key-outlined v-else-if="icon === 'key'" class="tree-icon" />
            <field-string-outlined v-else class="tree-icon" />
            <span>{{ title }}</span>
          </span>
        </template>
      </a-tree>
      
      <a-empty v-else description="暂无数据库" />
    </a-spin>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import {
  DatabaseOutlined,
  TableOutlined,
  KeyOutlined,
  FieldStringOutlined
} from '@ant-design/icons-vue'

export default defineComponent({
  components: {
    DatabaseOutlined,
    TableOutlined,
    KeyOutlined,
    FieldStringOutlined
  }
})
</script>

<style scoped>
.schema-tree {
  height: 100%;
  padding: 12px;
  overflow: auto;
  background: #fff;
  border-right: 1px solid #f0f0f0;
}

.schema-tree-header {
  margin-bottom: 8px;
}

.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tree-icon {
  color: #1890ff;
}

.tree-title {
  white-space: nowrap;
}

/* 减少树节点缩进 */
.schema-tree :deep(.ant-tree) {
  background: transparent;
}

.schema-tree :deep(.ant-tree-node-content-wrapper) {
  padding-left: 4px;
}

.schema-tree :deep(.ant-tree-switcher) {
  width: 20px;
  flex-shrink: 0;
}

.schema-tree :deep(.ant-tree-indent-unit) {
  width: 16px;
}
</style>
