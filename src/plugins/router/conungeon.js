export default {
  path: '/conungeon',
  name: 'conungeon',
  component: () => import('@/views/Conungeon/Home.vue'),
  children: [
    {
      path: 'about',
      component: () => import('@/views/Conungeon/About.vue'),
    },
    {
      path: 'fifteen',
      component: () => import('@/views/Conungeon/FifteenPuzzle.vue'),
    },
    {
      path: 'seven',
      component: () => import('@/views/Conungeon/SevenBridges.vue'),
    },
    {
      path: 'three',
      component: () => import('@/views/Conungeon/ThreeCups.vue'),
    },
  ],
};
