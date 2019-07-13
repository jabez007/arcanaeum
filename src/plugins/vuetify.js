import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import 'vuetify/src/stylus/app.styl';

Vue.use(Vuetify, {
  iconfont: 'md',
  options: {
    /*
     * will generate a css variable for each theme color, which can then use in a component's style.
     *
     * ex:
     *    .something {
     *      color: var(--v-primary-base)
     *      background-color: var(--v-accent-lighten2)
     *    }
     */
    customProperties: true,
  },
});
