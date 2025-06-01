import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/cryptotron',
      name: 'cryptotron',
      component: () => import('../views/CryptoTronApp.vue'),
      children: []
    },
    {
      path: "/cryptotron/:pathMatch(.*)",
      redirect: (to) => {
        console.debug(`Redirecting: ${to.path}`)
        return {
          name: "cryptotron",
          query: {
            initialRoute: to.path
          }
        }
      }
    }
  ],
})

export default router
