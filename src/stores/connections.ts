import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ConnectionConfig, ConnectionStatus } from '../types'

export const useConnectionStore = defineStore('connections', () => {
  const connections = ref<ConnectionConfig[]>([])
  const activeConnections = ref<Map<string, ConnectionStatus>>(new Map())

  const connectionList = computed(() => connections.value)
  const connectedCount = computed(() => {
    let count = 0
    activeConnections.value.forEach((status) => {
      if (status.connected) count++
    })
    return count
  })

  function setConnections(list: ConnectionConfig[]) {
    connections.value = list
  }

  function addConnection(config: ConnectionConfig) {
    connections.value.push(config)
  }

  function updateConnection(id: string, config: Partial<ConnectionConfig>) {
    const index = connections.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      connections.value[index] = { ...connections.value[index], ...config, updatedAt: Date.now() }
    }
  }

  function removeConnection(id: string) {
    const index = connections.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      connections.value.splice(index, 1)
    }
    activeConnections.value.delete(id)
  }

  function getConnection(id: string): ConnectionConfig | undefined {
    return connections.value.find((c) => c.id === id)
  }

  function setConnectionStatus(id: string, status: ConnectionStatus) {
    activeConnections.value.set(id, status)
  }

  function getConnectionStatus(id: string): ConnectionStatus | undefined {
    return activeConnections.value.get(id)
  }

  function clearAllConnections() {
    connections.value = []
    activeConnections.value.clear()
  }

  return {
    connections,
    activeConnections,
    connectionList,
    connectedCount,
    setConnections,
    addConnection,
    updateConnection,
    removeConnection,
    getConnection,
    setConnectionStatus,
    getConnectionStatus,
    clearAllConnections
  }
})
