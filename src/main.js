import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import Vuelidate from 'vuelidate'

const activatedLogs = false;
export function consoleLog(log) {
  activatedLogs && console.log(log);
};

Vue.config.productionTip = false

Vue.use(Vuelidate)

new Vue({
  router,
  render: function (h) { return h(App) }
}).$mount('#app')
