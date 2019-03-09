import Vue from 'vue';
import Babylon from 'vue-babylonjs';
import App from './App.vue';

Vue.use(Babylon);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
