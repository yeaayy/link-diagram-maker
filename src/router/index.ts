import BoardVue from '@/views/Board.vue'
import LoginVue from '@/views/Login.vue'
import MyBoardsVue from '@/views/MyBoards.vue'
import ProfileVue from '@/views/Profile.vue'
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
      path: '/board',
      name: 'my-boards',
      component: MyBoardsVue
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileVue
    },
    {
      path: '/:id',
      name: 'board',
      component: BoardVue
    },
  ]
})

export default router
