<script setup lang="ts">
import type { TableColumnType, TableProps } from 'ant-design-vue'
import { Table } from 'ant-design-vue'
import { computed, ref, watch } from 'vue'
import type { QueryResult } from '../../types'

interface Props {
  data?: QueryResult
  loading?: boolean
  pageSize?: number
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  data: undefined,
  loading: false,
  pageSize: 20,
  editable: false
})

defineEmits<{
  (e: 'cell-change', row: number, column: string, value: unknown): void
  (e: 'row-add'): void
  (e: 'row-delete', row: number): void
}>()

const currentPage = ref(1)
const selectedRowKeys = ref<(string | number)[]>([])

// 转换为表格列
const columns = computed<TableColumnType[]>(() => {
  if (!props.data?.fields) return []

  return props.data.fields.map((field, index) => ({
    title: field.name,
    dataIndex: index,
    key: `col-${index}`,
    width: 150,
    ellipsis: true,
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) => {
      const aVal = a[field.name]
      const bVal = b[field.name]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return -1
      if (bVal == null) return 1
      if (aVal === bVal) return 0
      return String(aVal) > String(bVal) ? 1 : -1
    }
  }))
})

// 转换为表格数据
const dataSource = computed(() => {
  if (!props.data?.rows) return []

  return props.data.rows.map((row, index) => {
    const record: Record<string, unknown> = { __rowIndex: index }
    props.data?.fields?.forEach((field, fieldIndex) => {
      record[field.name] = row[field.name]
      // 也存储索引形式的数据用于表格显示
      record[`__col_${fieldIndex}`] = row[field.name]
    })
    return record
  })
})

// 表格行选择
const rowSelection = computed<TableProps['rowSelection']>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: any[]) => {
    selectedRowKeys.value = keys
  }
}))

// 分页配置
const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: props.pageSize,
  total: props.data?.rows?.length || 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
  pageSizeOptions: ['10', '20', '50', '100']
}))

// 处理单元格点击
function handleCellClick(record: Record<string, unknown>, column: TableColumnType) {
  if (props.editable) {
    // 可以触发编辑模式
    console.log('Cell click:', record, column)
  }
}

// 处理表格变化
function handleTableChange(pag: { current?: number }) {
  if (pag.current) {
    currentPage.value = pag.current
  }
}

// 重置分页
watch(() => props.data, () => {
  currentPage.value = 1
  selectedRowKeys.value = []
})

// 暴露方法
defineExpose({
  getSelectedRows: () => selectedRowKeys.value,
  clearSelection: () => {
    selectedRowKeys.value = []
  }
})
</script>

<template>
  <div class="data-grid">
    <div v-if="data" class="grid-info">
      <span v-if="data.affectedRows !== undefined">
        影响行数: {{ data.affectedRows }}
        <span v-if="data.insertId"> | 插入ID: {{ data.insertId }}</span>
      </span>
      <span v-else>
        共 {{ data.rows?.length || 0 }} 行
      </span>
    </div>

    <Table :columns="columns" :data-source="dataSource" :loading="loading" :pagination="pagination"
      :row-selection="editable ? rowSelection : undefined"
      :row-key="(record: Record<string, unknown>) => record.__rowIndex as number"
      :scroll="{ x: 'max-content', y: 'calc(100vh - 300px)' }" size="small" bordered @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="editable">
          <div class="editable-cell" @click="handleCellClick(record, column)">
            {{ record[column.dataIndex as string] }}
          </div>
        </template>
        <template v-else>
          <span class="cell-value">
            {{ record[column.dataIndex as string] }}
          </span>
        </template>
      </template>

      <template #emptyText>
        <a-empty description="暂无数据" />
      </template>
    </Table>
  </div>
</template>

<style scoped>
.data-grid {
  height: 100%;
  overflow: auto;
}

.grid-info {
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #666;
}

.editable-cell {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 2px;
  transition: background 0.2s;
}

.editable-cell:hover {
  background: #e6f7ff;
}

.cell-value {
  white-space: pre-wrap;
  word-break: break-all;
}

.data-grid :deep(.ant-table) {
  font-size: 13px;
}

.data-grid :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
}

.data-grid :deep(.ant-table-tbody > tr > td) {
  padding: 8px 12px;
}
</style>
