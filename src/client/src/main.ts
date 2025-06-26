import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// NOTE
import App from './App.vue' // ignore for a while - might get a error when compiled to the prod so keep an eye
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
