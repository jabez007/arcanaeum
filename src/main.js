import Vue from 'vue';
import './plugins/vuetify'
import Babylon from 'vue-babylonjs';
import VueClipboard from 'vue-clipboard2';
import App from './App.vue';
import router from './router'

Vue.use(Babylon);
Vue.use(VueClipboard);

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
