import Vue from 'vue';
import './plugins/vuetify';
/* import './plugins/vue-babylon'; // Don't need Babylon installed across the whole app */
import './plugins/vueClipboard';
import './plugins/vueKonva';
import router from './plugins/router';
import App from './App.vue';
import './registerServiceWorker';

Vue.config.productionTip = false;

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
