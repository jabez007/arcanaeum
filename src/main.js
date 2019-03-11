import Vue from 'vue';
import './plugins/vuetify'
import Babylon from 'vue-babylonjs';
import App from './App.vue';
import router from './router'

Vue.use(Babylon);

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
