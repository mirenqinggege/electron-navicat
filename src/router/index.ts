import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Connections',
    component: () => import('../views/Connection/List.vue'),
    meta: { title: '连接管理' }
  },
  {
    path: '/connection/new',
    name: 'NewConnection',
    component: () => import('../views/Connection/Form.vue'),
    meta: { title: '新建连接' }
  },
  {
    path: '/connection/:connId/edit',
    name: 'EditConnection',
    component: () => import('../views/Connection/Form.vue'),
    meta: { title: '编辑连接' }
  },
  {
    path: '/workspace/:connId',
    name: 'Workspace',
    component: () => import('../views/Workspace/index.vue'),
    meta: { title: '工作区' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - Electron Native`
  }
  next()
})

export default router
