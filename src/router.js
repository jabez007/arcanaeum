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
          path: 'autokey',
          component: () => import('./views/CryptoTron/AutokeyCipher.vue'),
        },
        {
          path: 'baconian',
          component: () => import('./views/CryptoTron/BaconianCipher.vue'),
        },
        {
          path: 'caesar',
          component: () => import('./views/CryptoTron/CaesarCipher.vue'),
        },
        {
          path: 'huffmanian',
          component: () => import('./views/CryptoTron/HuffmanianCipher.vue'),
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
    {
      path:'/conservatoire',
      name: 'conservatoire',
      component: () => import('./views/Conservatoire/Home.vue'),
      children: [
        {
          path: 'about',
          component: () => import('./views/Conservatoire/About.vue'),
        },
        {
          path: 'journal',
          component: () => import('./views/Conservatoire/RedEyedJournal.vue'),
        },
        {
          path: 'allonsy',
          component: () => import('./views/Conservatoire/ProjectAllons-y.vue'),
        },
        {
          path: 'construct',
          component: () => import('./views/Conservatoire/ManaConstruct.vue'),
        },
      ],
    },
    {
      path:'/oracle',
      name: 'oracle',
      component: () => import('./views/Oracle/Home.vue'),
      children: [
        {
          path: '',
          component: () => import('./views/Oracle/Oracle.vue'),
        },
      ],
    },
  ],
});
