import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

router.beforeEach(function (to, from, next) {
  const title = to.meta.title as string;
  const appName = import.meta.env.VITE_APP_NAME;
  document.title = title ? `${title} | ${appName}` : appName;
  next();
});

app.use(router)

app.mount('#app')
