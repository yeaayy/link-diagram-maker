import BoardVue from '@/views/Board.vue'
import LoginVue from '@/views/Login.vue'
import MyBoardsVue from '@/views/MyBoards.vue'
import RegisterVue from '@/views/Register.vue'
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginVue
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterVue
    },
    {
      path: '/board',
      name: 'my-boards',
      component: MyBoardsVue
    },
    {
      path: '/b/:id',
      name: 'board',
      component: BoardVue
    },
  ]
})

export default router
