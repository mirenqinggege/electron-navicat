<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ipcService } from '../../services/ipc'
import { useConnectionStore } from '../../stores/connections'
import { useWorkspaceStore, type SqlHistoryItem } from '../../stores/workspace'
import SchemaTree from '../../components/SchemaTree/index.vue'
import SqlEditor from '../../components/SqlEditor/index.vue'
import DataGrid from '../../components/DataGrid/index.vue'

const route = useRoute()
const router = useRouter()
const connectionStore = useConnectionStore()
const workspaceStore = useWorkspaceStore()

const connId = computed(() => route.params.connId as string)
const connection = computed(() => connectionStore.getConnection(connId.value))

const sidebarCollapsed = ref(false)
const executing = ref(false)

async function connect() {
  if (!connId.value) return

  try {
    const conn = connectionStore.getConnection(connId.value)
    if (!conn) {
      message.error('连接配置不存在')
      return
    }
    const result = await ipcService.connect(conn)
    if (result.success && result.connId) {
      workspaceStore.setConnId(result.connId)
      connectionStore.setConnectionStatus(connId.value, {
        id: connId.value,
        connected: true
      })
      message.success('连接成功')
    } else {
      message.error(`连接失败: ${result.error || '未知错误'}`)
    }
  } catch (error) {
    message.error('连接失败')
    console.error(error)
  }
}

async function disconnect() {
  if (!connId.value) return

  try {
    await ipcService.disconnect(workspaceStore.connId || connId.value)
    connectionStore.setConnectionStatus(connId.value, {
      id: connId.value,
      connected: false
    })
    workspaceStore.reset()
    message.success('已断开连接')
  } catch (error) {
    message.error('断开连接失败')
    console.error(error)
  }
}

async function executeSql() {
  const activeTab = workspaceStore.activeTab
  if (!activeTab?.sql.trim()) {
    message.warning('请输入 SQL 语句')
    return
  }

  executing.value = true
  workspaceStore.updateTabLoading(activeTab.id, true)

  const startTime = Date.now()

  try {
    const response = await ipcService.query(workspaceStore.connId || '', activeTab.sql)
    const duration = Date.now() - startTime

    if (response.success && response.data) {
      workspaceStore.updateTabResult(activeTab.id, response.data)

      const historyItem: SqlHistoryItem = {
        id: `history-${Date.now()}`,
        sql: activeTab.sql,
        timestamp: Date.now(),
        duration
      }
      workspaceStore.addSqlHistory(historyItem)

      message.success(`执行成功，耗时 ${duration}ms`)
    } else {
      throw new Error(response.error || '执行失败')
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '执行失败'
    workspaceStore.updateTabError(activeTab.id, errorMsg)

    const historyItem: SqlHistoryItem = {
      id: `history-${Date.now()}`,
      sql: activeTab.sql,
      timestamp: Date.now(),
      error: errorMsg
    }
    workspaceStore.addSqlHistory(historyItem)

    message.error(`执行失败: ${errorMsg}`)
  } finally {
    executing.value = false
    workspaceStore.updateTabLoading(activeTab.id, false)
  }
}

function handleAddTab() {
  workspaceStore.addQueryTab()
}

function handleRemoveTab(id: string) {
  if (workspaceStore.queryTabs.length === 1) {
    message.warning('至少保留一个标签页')
    return
  }
  workspaceStore.removeQueryTab(id)
}

function handleTabChange(id: string) {
  workspaceStore.setActiveTab(id)
}

function handleSqlChange(sql: string) {
  if (workspaceStore.activeTab) {
    workspaceStore.updateTabSql(workspaceStore.activeTab.id, sql)
  }
}

function handleHistoryClick(item: SqlHistoryItem) {
  if (workspaceStore.activeTab) {
    workspaceStore.updateTabSql(workspaceStore.activeTab.id, item.sql)
  }
}

function handleBack() {
  disconnect()
  router.push('/')
}

onMounted(() => {
  if (!workspaceStore.queryTabs.length) {
    workspaceStore.addQueryTab()
  }
  
  if (connId.value) {
    const status = connectionStore.getConnectionStatus(connId.value)
    if (!status?.connected) {
      connect()
    } else {
      workspaceStore.setConnId(connId.value)
    }
  }
})

onUnmounted(() => {
  // 可选：离开页面时断开连接
  // disconnect()
})
</script>

<template>
  <div class="workspace">
    <a-layout class="workspace-layout">
      <a-layout-header class="workspace-header">
        <div class="header-left">
          <a-button type="text" @click="handleBack">
            <template #icon>
              <arrow-left-outlined />
            </template>
          </a-button>
          <span class="connection-name">{{ connection?.name || '未命名连接' }}</span>
          <a-tag v-if="connection" :color="connection.type === 'mysql' ? 'blue' : connection.type === 'postgresql' ? 'green' : 'orange'">
            {{ connection.type.toUpperCase() }}
          </a-tag>
        </div>
        <div class="header-right">
          <a-button v-if="sidebarCollapsed" type="text" @click="sidebarCollapsed = false">
            <menu-unfold-outlined />
          </a-button>
          <a-button v-else type="text" @click="sidebarCollapsed = true">
            <menu-fold-outlined />
          </a-button>
        </div>
      </a-layout-header>
      
      <a-layout class="workspace-body">
        <a-layout-sider
          v-model:collapsed="sidebarCollapsed"
          :width="280"
          :collapsed-width="0"
          theme="light"
          class="workspace-sider"
        >
          <div class="sider-content">
            <div class="sider-section">
              <div class="section-title">数据库结构</div>
              <SchemaTree />
            </div>
            
            <div class="sider-section sql-history">
              <div class="section-title">SQL 历史</div>
              <div class="history-list">
                <div
                  v-for="item in workspaceStore.sqlHistory.slice(0, 20)"
                  :key="item.id"
                  class="history-item"
                  :class="{ error: item.error }"
                  @click="handleHistoryClick(item)"
                >
                  <div class="history-sql">{{ item.sql.slice(0, 50) }}{{ item.sql.length > 50 ? '...' : '' }}</div>
                  <div class="history-meta">
                    <span v-if="item.duration">{{ item.duration }}ms</span>
                    <span v-if="item.error" class="error-text">错误</span>
                  </div>
                </div>
                <a-empty v-if="!workspaceStore.sqlHistory.length" description="暂无历史" />
              </div>
            </div>
          </div>
        </a-layout-sider>
        
        <a-layout-content class="workspace-content">
          <div class="tabs-container">
            <a-tabs
              v-model:activeKey="workspaceStore.activeTabId"
              type="editable-card"
              @change="handleTabChange"
              @edit="(targetKey: string | undefined, action: string) => action === 'add' ? handleAddTab() : targetKey && handleRemoveTab(targetKey)"
            >
              <a-tab-pane
                v-for="tab in workspaceStore.queryTabs"
                :key="tab.id"
                :tab="tab.title"
              >
                <div class="tab-content">
                  <div class="editor-section">
                    <SqlEditor
                      :model-value="tab.sql"
                      @update:model-value="handleSqlChange"
                      @execute="executeSql"
                    >
                      <template #toolbar>
                        <a-button
                          type="primary"
                          size="small"
                          :loading="executing"
                          @click="executeSql"
                        >
                          执行 (Ctrl+Enter)
                        </a-button>
                        <a-button size="small" @click="() => workspaceStore.updateTabSql(tab.id, '')">
                          清空
                        </a-button>
                      </template>
                    </SqlEditor>
                  </div>
                  
                  <div class="result-section">
                    <div v-if="tab.loading" class="result-loading">
                      <a-spin tip="执行中..." />
                    </div>
                    <div v-else-if="tab.error" class="result-error">
                      <a-alert type="error" :message="tab.error" show-icon />
                    </div>
                    <DataGrid
                      v-else-if="tab.result"
                      :data="tab.result"
                      :loading="false"
                    />
                    <div v-else class="result-empty">
                      <a-empty description="输入 SQL 并执行以查看结果" />
                    </div>
                  </div>
                </div>
              </a-tab-pane>
            </a-tabs>
          </div>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import {
  ArrowLeftOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons-vue'

export default defineComponent({
  components: {
    ArrowLeftOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined
  }
})
</script>

<style scoped>
.workspace {
  height: 100vh;
  overflow: hidden;
}

.workspace-layout {
  height: 100%;
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  height: 48px;
  line-height: 48px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.connection-name {
  font-size: 16px;
  font-weight: 500;
}

.workspace-body {
  height: calc(100vh - 48px);
}

.workspace-sider {
  border-right: 1px solid #f0f0f0;
}

.sider-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sider-section {
  flex-shrink: 0;
}

.sider-section.sql-history {
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #f0f0f0;
}

.section-title {
  padding: 12px 16px;
  font-weight: 500;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.history-list {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

.history-item {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 4px;
  background: #fafafa;
  transition: background 0.2s;
}

.history-item:hover {
  background: #e6f7ff;
}

.history-item.error {
  border-left: 3px solid #ff4d4f;
}

.history-sql {
  font-size: 12px;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}

.error-text {
  color: #ff4d4f;
}

.workspace-content {
  background: #fff;
}

.tabs-container {
  height: 100%;
}

.tabs-container :deep(.ant-tabs) {
  height: 100%;
}

.tabs-container :deep(.ant-tabs-content) {
  height: calc(100% - 46px);
}

.tabs-container :deep(.ant-tabs-tabpane) {
  height: 100%;
}

.tab-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-section {
  height: 200px;
  border-bottom: 1px solid #f0f0f0;
}

.result-section {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.result-loading,
.result-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.result-error {
  padding: 12px;
}
</style>
