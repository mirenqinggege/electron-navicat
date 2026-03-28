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
  return store.databases.map(db => ({
    key: `db-${db}`,
    title: db,
    icon: 'database',
    children: buildTableChildren(db)
  }))
}

function buildTableChildren(dbName: string): TreeProps['treeData'] {
  const tables = store.tables.get(dbName) || []
  return tables.map(table => ({
    key: `table-${dbName}-${table.name}`,
    title: table.name,
    icon: 'table',
    children: buildColumnChildren(dbName, table.name)
  }))
}

function buildColumnChildren(dbName: string, tableName: string): TreeProps['treeData'] {
  const tableKey = `${dbName}.${tableName}`
  const columns = store.columns.get(tableKey) || []
  return columns.map(col => ({
    key: `col-${dbName}-${tableName}-${col.name}`,
    title: `${col.name} (${col.type})`,
    icon: col.key === 'PRI' ? 'key' : col.nullable ? 'column' : 'column-height',
    isLeaf: true
  }))
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

  store.setLoadingTables(dbName, true)

  try {
    const response = await ipcService.getTables(store.connId, dbName)
    if (response.success && response.data) {
      store.setTables(dbName, response.data)
      treeData.value = buildTreeData()
    } else {
      throw new Error(response.error || '加载失败')
    }
  } catch (error) {
    message.error(`加载 ${dbName} 的表列表失败`)
    console.error(error)
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
  expandedKeys.value = keys
  
  for (const key of keys) {
    if (key.startsWith('db-')) {
      const dbName = key.replace('db-', '')
      if (!store.tables.has(dbName)) {
        await loadTables(dbName)
      }
    } else if (key.startsWith('table-')) {
      const [, dbName, tableName] = key.split('-')
      const tableKey = `${dbName}.${tableName}`
      if (!store.columns.has(tableKey)) {
        await loadColumns(dbName, tableName)
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
watch(() => store.connId, (newId) => {
  if (newId) {
    loadDatabases()
  }
})

onMounted(() => {
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
        :show-icon="true"
        :filter-tree-node="filterTree"
        @expand="handleExpand"
        @select="handleSelect"
      >
        <template #icon="{ icon }">
          <database-outlined v-if="icon === 'database'" />
          <table-outlined v-else-if="icon === 'table'" />
          <key-outlined v-else-if="icon === 'key'" />
          <field-string-outlined v-else />
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
</style>
