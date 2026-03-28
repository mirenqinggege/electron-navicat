<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useConnectionStore } from '../../stores/connections'
import { connectionsDB } from '../../services/db'
import type { ConnectionConfig } from '../../types'

const router = useRouter()
const store = useConnectionStore()

const loading = ref(false)
const connections = ref<ConnectionConfig[]>([])

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '主机', dataIndex: 'host', key: 'host' },
  { title: '端口', dataIndex: 'port', key: 'port' },
  { title: '数据库', dataIndex: 'database', key: 'database' },
  { title: '操作', key: 'action', width: 200 }
]

async function loadConnections() {
  loading.value = true
  try {
    const list = await connectionsDB.getAll()
    connections.value = list
    store.setConnections(list)
  } catch (error) {
    message.error('加载连接列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  router.push('/workspace/new')
}

function handleEdit(record: ConnectionConfig) {
  router.push(`/workspace/${record.id}`)
}

async function handleDelete(record: ConnectionConfig) {
  try {
    await connectionsDB.delete(record.id)
    store.removeConnection(record.id)
    message.success('删除成功')
    await loadConnections()
  } catch (error) {
    message.error('删除失败')
    console.error(error)
  }
}

onMounted(() => {
  loadConnections()
})
</script>

<template>
  <div class="connection-list">
    <a-page-header title="数据库连接" sub-title="管理您的数据库连接配置">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          新建连接
        </a-button>
      </template>
    </a-page-header>

    <a-card :loading="loading">
      <a-table
        :columns="columns"
        :data-source="connections"
        :row-key="(record: ConnectionConfig) => record.id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="record.type === 'mysql' ? 'blue' : record.type === 'postgresql' ? 'green' : 'orange'">
              {{ record.type.toUpperCase() }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确定要删除这个连接吗？"
                @confirm="handleDelete(record)"
              >
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
.connection-list {
  padding: 24px;
}
</style>
