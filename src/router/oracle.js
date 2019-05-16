export default {
  path: '/oracle',
  name: 'oracle',
  component: () => import('@/views/Oracle/Home.vue'),
  children: [
    {
      path: '',
      component: () => import('@/views/Oracle/Oracle.vue'),
    },
  ],
};
