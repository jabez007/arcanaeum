import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/Home.vue')
    },
    {
      path:'/cryptotron',
      name: 'cryptotron',
      component: () => import('./views/CryptoTron/Home.vue'),
      children: [
        {
          path: 'about',
          component: () => import('./views/CryptoTron/About.vue'),
        },
        {
          path: 'affine',
          component: () => import('./views/CryptoTron/AffineCipher.vue'),
        },
        {
          path: 'caesar',
          component: () => import('./views/CryptoTron/CaesarCipher.vue'),
        },
        {
          path: 'polybius',
          component: () => import('./views/CryptoTron/PolybiusCipher.vue'),
        },
        {
          path: 'railfence',
          component: () => import('./views/CryptoTron/RailFenceCipher.vue'),
        },
      ],
    },
  ],
});
