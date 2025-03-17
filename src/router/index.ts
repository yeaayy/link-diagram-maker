import BoardVue from '@/views/Board.vue'
import LoginVue from '@/views/Login.vue'
import MyBoardsVue from '@/views/MyBoards.vue'
import RegisterVue from '@/views/Register.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginVue
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterVue,

    },
    {
      path: '/board',
      name: 'my-boards',
      component: MyBoardsVue
    },
    {
      path: '/:id',
      name: 'board',
      component: BoardVue
    },
  ]
})

export default router
