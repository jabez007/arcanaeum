export default {
  path: '/cryptotron',
  name: 'cryptotron',
  component: () => import('@/views/CryptoTron/Home.vue'),
  children: [
    {
      path: 'about',
      component: () => import('@/views/CryptoTron/About.vue'),
    },
    {
      path: 'affine',
      component: () => import('@/views/CryptoTron/AffineCipher.vue'),
    },
    {
      path: 'autokey',
      component: () => import('@/views/CryptoTron/AutokeyCipher.vue'),
    },
    {
      path: 'baconian',
      component: () => import('@/views/CryptoTron/BaconianCipher.vue'),
    },
    {
      path: 'caesar',
      component: () => import('@/views/CryptoTron/CaesarCipher.vue'),
    },
    {
      path: 'desideratum',
      component: () => import('@/views/CryptoTron/Desideratum.vue'),
    },
    {
      path: 'huffmanian',
      component: () => import('@/views/CryptoTron/HuffmanianCipher.vue'),
    },
    {
      path: 'polybius',
      component: () => import('@/views/CryptoTron/PolybiusCipher.vue'),
    },
    {
      path: 'railfence',
      component: () => import('@/views/CryptoTron/RailFenceCipher.vue'),
    },
    {
      path: 'substitution',
      component: () => import('@/views/CryptoTron/SubstitutionCipher.vue'),
    },
  ],
};
