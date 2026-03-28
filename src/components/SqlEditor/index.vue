<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { sql, StandardSQL } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'

interface Props {
  modelValue: string
  placeholder?: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入 SQL 语句...',
  readonly: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'execute', sql: string): void
}>()

const editorContainer = ref<HTMLElement>()
const editorView = shallowRef<EditorView>()

// 创建编辑器
function createEditor() {
  if (!editorContainer.value) return
  
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const newValue = update.state.doc.toString()
      emit('update:modelValue', newValue)
    }
  })
  
  editorView.value = new EditorView({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      sql({
        dialect: StandardSQL
      }),
      oneDark,
      keymap.of([indentWithTab]),
      updateListener,
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px'
        },
        '.cm-scroller': {
          overflow: 'auto'
        },
        '.cm-content': {
          padding: '8px 0'
        }
      }),
      EditorView.lineWrapping,
      EditorView.editable.of(!props.readonly)
    ],
    parent: editorContainer.value
  })
}

// 执行 SQL 快捷键 (Ctrl/Cmd + Enter)
function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    emit('execute', props.modelValue)
  }
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (editorView.value) {
    const currentValue = editorView.value.state.doc.toString()
    if (newValue !== currentValue) {
      editorView.value.dispatch({
        changes: {
          from: 0,
          to: editorView.value.state.doc.length,
          insert: newValue
        }
      })
    }
  }
})

// 设置 SQL 内容
function setSql(sql: string) {
  emit('update:modelValue', sql)
}

// 获取 SQL 内容
function getSql(): string {
  return props.modelValue
}

// 清空内容
function clear() {
  emit('update:modelValue', '')
}

// 暴露方法给父组件
defineExpose({
  setSql,
  getSql,
  clear
})

onMounted(() => {
  createEditor()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  editorView.value?.destroy()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="sql-editor">
    <div class="editor-toolbar">
      <slot name="toolbar" />
    </div>
    <div ref="editorContainer" class="editor-container" />
  </div>
</template>

<style scoped>
.sql-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

/* CodeMirror 暗色主题适配 */
.sql-editor :deep(.cm-editor) {
  height: 100%;
}

.sql-editor :deep(.cm-scroller) {
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
}
</style>
