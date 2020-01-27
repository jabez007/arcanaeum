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
      path: 'bacon',
      component: () => import('@/views/CryptoTron/BaconianCipher.vue'),
    },
    {
      path: 'beaufort',
      component: () => import('@/views/CryptoTron/BeaufortCipher.vue'),
    },
    {
      path: 'builder/:sharedJson?',
      component: () => import('@/views/CryptoTron/BYOA.vue'),
      props: true,
    },
    {
      path: 'caesar',
      component: () => import('@/views/CryptoTron/CaesarCipher.vue'),
    },
    {
      path: 'columnar-transposition',
      component: () => import('@/views/CryptoTron/ColumnarTranspositionCipher.vue'),
    },
    {
      path: 'desideratum',
      component: () => import('@/views/CryptoTron/Desideratum.vue'),
    },
    {
      path: 'four-square',
      component: () => import('@/views/CryptoTron/FourSquareCipher.vue'),
    },
    {
      path: 'huffman',
      component: () => import('@/views/CryptoTron/HuffmanianCipher.vue'),
    },
    {
      path: 'morellet',
      component: () => import('@/views/CryptoTron/MorelletCipher.vue'),
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
      path: 'runningKey',
      component: () => import('@/views/CryptoTron/RunningKeyCipher.vue'),
    },
    {
      path: 'substitution',
      component: () => import('@/views/CryptoTron/SubstitutionCipher.vue'),
    },
    {
      path: 'vigenere',
      component: () => import('@/views/CryptoTron/VigenereCipher.vue'),
    },
  ],
};
