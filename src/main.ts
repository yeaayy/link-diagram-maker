import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import createTitleDirective from './utils/TitleDirective'

const app = createApp(App)

app.directive('title', createTitleDirective(title => {
  const appName = import.meta.env.VITE_APP_NAME;
  return title ? `${title} | ${appName}` : appName
}));

app.use(router)

app.mount('#app')
