<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { ConfigProvider } from 'ant-design-vue'
</script>

<template>
  <ConfigProvider :locale="zhCN">
    <a-layout class="app-layout">
      <a-layout-header class="app-header">
        <div class="logo">Electron Native</div>
      </a-layout-header>
      <a-layout-content class="app-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </ConfigProvider>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-header {
  background: #001529;
  padding: 0 24px;
  display: flex;
  align-items: center;
}

.logo {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.app-content {
  background: #f0f2f5;
}
</style>
