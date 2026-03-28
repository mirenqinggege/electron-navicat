<script setup lang="ts">
import { ref, computed, onMounted, toRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { connectionsDB } from '../../services/db'
import { generateId } from '../../services/crypto'
import { ipcService } from '../../services/ipc'
import { useConnectionStore } from '../../stores/connections'
import type { ConnectionConfig } from '../../types'

const router = useRouter()
const route = useRoute()
const store = useConnectionStore()

const isEdit = computed(() => route.params.connId !== 'new')
const connId = computed(() => route.params.connId as string)

const formRef = ref()
const loading = ref(false)
const testing = ref(false)

const formState = ref<ConnectionConfig>({
  id: '',
  name: '',
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: '',
  options: {},
  createdAt: Date.now(),
  updatedAt: Date.now()
})

const dbTypeOptions = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'SQLite', value: 'sqlite' }
]

const defaultPorts: Record<string, number> = {
  mysql: 3306,
  postgresql: 5432,
  sqlite: 0
}

function handleTypeChange(type: string) {
  formState.value.port = defaultPorts[type] || 3306
}

async function loadConnection() {
  if (!isEdit.value || !connId.value) return
  
  loading.value = true
  try {
    const conn = await connectionsDB.getById(connId.value)
    if (conn) {
      formState.value = { ...conn }
    } else {
      message.error('连接不存在')
      router.push('/')
    }
  } catch (error) {
    message.error('加载连接失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function handleTest() {
  testing.value = true
  try {
    // 使用 toRaw 获取原始对象，避免 Vue 响应式代理导致序列化问题
    const config = toRaw(formState.value)
    const result = await ipcService.testConnection(config)
    if (result.success) {
      message.success('连接测试成功')
    } else {
      message.error(`连接失败: ${result.error || '未知错误'}`)
    }
  } catch (error) {
    message.error('连接测试失败')
    console.error(error)
  } finally {
    testing.value = false
  }
}

async function handleSave() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const now = Date.now()
    const rawState = toRaw(formState.value)
    const config: ConnectionConfig = {
      ...rawState,
      id: isEdit.value ? connId.value : generateId(),
      updatedAt: now,
      createdAt: isEdit.value ? rawState.createdAt : now
    }

    if (isEdit.value) {
      await connectionsDB.update(config)
      store.updateConnection(connId.value, config)
    } else {
      await connectionsDB.add(config)
      store.addConnection(config)
    }

    message.success('保存成功')
    router.push('/')
  } catch (error) {
    message.error('保存失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.push('/')
}

onMounted(() => {
  loadConnection()
})
</script>

<template>
  <div class="connection-form">
    <a-page-header
      :title="isEdit ? '编辑连接' : '新建连接'"
      @back="handleCancel"
    >
      <template #extra>
        <a-space>
          <a-button @click="handleTest" :loading="testing">测试连接</a-button>
          <a-button type="primary" @click="handleSave" :loading="loading">保存</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card :loading="loading && isEdit">
      <a-form
        ref="formRef"
        :model="formState"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 14 }"
      >
        <a-form-item label="连接名称" name="name" :rules="[{ required: true, message: '请输入连接名称' }]">
          <a-input v-model:value="formState.name" placeholder="请输入连接名称" />
        </a-form-item>

        <a-form-item label="数据库类型" name="type" :rules="[{ required: true, message: '请选择数据库类型' }]">
          <a-select v-model:value="formState.type" :options="dbTypeOptions" @change="handleTypeChange" />
        </a-form-item>

        <template v-if="formState.type !== 'sqlite'">
          <a-form-item label="主机地址" name="host" :rules="[{ required: true, message: '请输入主机地址' }]">
            <a-input v-model:value="formState.host" placeholder="localhost" />
          </a-form-item>

          <a-form-item label="端口" name="port" :rules="[{ required: true, message: '请输入端口' }]">
            <a-input-number v-model:value="formState.port" :min="1" :max="65535" style="width: 100%" />
          </a-form-item>

          <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
            <a-input v-model:value="formState.username" placeholder="root" />
          </a-form-item>

          <a-form-item label="密码" name="password">
            <a-input-password v-model:value="formState.password" placeholder="请输入密码" />
          </a-form-item>

          <a-form-item label="数据库" name="database" :rules="[{ required: true, message: '请输入数据库名' }]">
            <a-input v-model:value="formState.database" placeholder="请输入数据库名" />
          </a-form-item>
        </template>

        <template v-else>
          <a-form-item label="数据库文件" name="database" :rules="[{ required: true, message: '请选择数据库文件' }]">
            <a-input v-model:value="formState.database" placeholder="/path/to/database.db" />
          </a-form-item>
        </template>
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
.connection-form {
  padding: 24px;
}
</style>
