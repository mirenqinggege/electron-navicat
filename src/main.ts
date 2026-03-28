import { createApp, nextTick } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './style.css'
import App from './App.vue'
import router from './router'
import pinia from './stores'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(Antd)

app.mount('#app')

nextTick(() => {
  window.ipcRenderer?.on('main-process-message', (_event, message) => {
    console.log(message)
  })
})
