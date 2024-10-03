import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

router.beforeEach(function (to, from, next) {
  const title = to.meta.title as string
  document.title = title ? `${title} | Corkboard` : 'Corkboard';
  next();
});

app.use(router)

app.mount('#app')
