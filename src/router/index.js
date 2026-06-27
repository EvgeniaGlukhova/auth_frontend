import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import DashboardPage from '../views/DashboardPage.vue'

const routes = [
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }  // только для неавторизованных
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true }    // требует авторизации
  },
  {
    path: '/warehouse',
    component: () => import('../views/Warehouse.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/customers',
    component: () => import('../views/Customers.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    component: () => import('../views/Orders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/analytics',
    component: () => import('../views/Analytics.vue'),
    meta: { requiresAuth: true }
  }
]

console.log('ROUTER LOADED')
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Защита маршрутов - НОВАЯ ВЕРСИЯ (без next)
// router.beforeEach(async (to, from) => {
//   const authStore = useAuthStore()
//
//   // Восстанавливаем сессию, если есть токен
//   if (!authStore.isAuthenticated && localStorage.getItem('access_token')) {
//     authStore.restoreSession()
//     await authStore.fetchUser()
//   }
//
//   // Если маршрут требует авторизации, а пользователь не авторизован
//   if (to.meta.requiresAuth && !authStore.isAuthenticated) {
//     return '/login'
//   }
//
//   // Если маршрут для гостей (логин), а пользователь авторизован
//   if (to.meta.requiresGuest && authStore.isAuthenticated) {
//     return '/dashboard'
//   }
//
//   // Разрешаем переход
//   return true
// })
  // всегда пускаем - времменно
router.beforeEach(async (to, from) => {
  return true
})

export default router
