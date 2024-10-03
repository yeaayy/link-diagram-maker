import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue')
    },
    {
      path: '/board',
      name: 'my-boards',
      component: () => import('../views/MyBoards.vue')
    },
    {
      path: '/b/:id',
      name: 'board',
      component: () => import('../views/Board.vue')
    },
  ]
})

export default router
