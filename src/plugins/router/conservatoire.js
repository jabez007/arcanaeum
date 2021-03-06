export default {
  path: '/conservatoire',
  name: 'conservatoire',
  component: () => import('@/views/Conservatoire/Home.vue'),
  children: [
    {
      path: 'about',
      component: () => import('@/views/Conservatoire/About.vue'),
    },
    {
      path: 'journal',
      component: () => import('@/views/Conservatoire/RedEyedJournal.vue'),
    },
    {
      path: 'allons-y',
      component: () => import('@/views/Conservatoire/ProjectAllons-y.vue'),
    },
    {
      path: 'construct',
      component: () => import('@/views/Conservatoire/ManaConstruct.vue'),
    },
    {
      path: 'staff-fighting',
      component: () => import('@/views/Conservatoire/StaffFighting.vue'),
    },
  ],
};
