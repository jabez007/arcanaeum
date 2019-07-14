import Vue from 'vue';
import Router from 'vue-router';
// sections
import conservatoire from './conservatoire';
import conungeon from './conungeon';
import cryptotron from './cryptotron';
import oracle from './oracle';
import quotidian from './quotidian';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
    },
    conservatoire,
    conungeon,
    cryptotron,
    oracle,
    quotidian,
  ],
});
