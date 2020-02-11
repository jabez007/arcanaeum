<template>
  <div id="aether">
    <component :is="menu" :boxes="boxes"></component>
  </div>
</template>

<script>
import DesktopMenu from '@/components/DesktopMenu.vue';
import MobileMenu from '@/components/MobileMenu.vue';

const BOXES = [
  {
    path: '/cryptotron/about',
    name: 'CryptoTron',
    pos: [4, 0, 0],
  },
  {
    path: '/conservatoire/about',
    name: 'Conservatoire',
    pos: [-4, 0, 0],
  },
  {
    path: '/oracle',
    name: 'Oracle',
    pos: [0, 4, 0],
  },
  {
    path: '/quotidian',
    name: 'Quotidian Schemer',
    pos: [0, -4, 0],
  },
  {
    path: '/conungeon/about',
    name: 'The Conungeon',
    pos: [0, 0, 4],
  },
  {
    path: '',
    name: '',
    pos: [0, 0, -4],
  },
];

export default {
  name: 'home',
  computed: {
    boxes() {
      return BOXES;
    },
    isTouchDevice() {
      /*
       * https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript/4819886#4819886
       */
      if (
        'ontouchstart' in window
        // eslint-disable-next-line no-undef
        || (window.DocumentTouch && document instanceof DocumentTouch)
      ) {
        return true;
      }

      const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');

      const mq = query => window.matchMedia(query).matches;

      // include the 'heartz' as a way to have a non matching MQ to help terminate the join
      // https://git.io/vznFH
      const query = [
        '(',
        prefixes.join('touch-enabled),('),
        'heartz',
        ')',
      ].join('');
      return mq(query);
    },
    menu() {
      return this.isTouchDevice ? MobileMenu : DesktopMenu;
    },
  },
};
</script>

<style scoped>
#aether {
  width: 100%;
  height: 100%;
  position: fixed;
}
</style>
