import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/account',
      name: 'accountManage',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AccountManage.vue')
    }, 

      {
      path: '/journalEntry',
      name: 'journalEntry',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../components/JournalEntry.vue')
    },
    // 会计分类账
    {
      path: '/ledger',
      name: 'ledger',
      component: () => import('../components/Ledger.vue')
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: () => import('../components/Accounts.vue')
    },
    {
      path: '/ledgers',
      name: 'ledgers',
      component: () => import('../components/Ledgers.vue')
    },
    //ledgers



  ]
})

export default router
