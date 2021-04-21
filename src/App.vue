<template>
  <div id="arcanaeum">
    <div id="background"></div>
    <transition name="scale-transition" mode="out-in">
      <router-view />
    </transition>
    <v-snackbar :value="update !== null" color="info" :timeout="0" top>
      <h3 style="font-family: Roboto">New content is available</h3>
      <v-btn icon @click="onRefresh">
        <v-icon>refresh</v-icon>
      </v-btn>
    </v-snackbar>
  </div>
</template>

<script>
import EventBus from '_/eventBus';

export default {
  name: 'app',
  data: () => ({
    update: null,
  }),
  methods: {
    onRefresh() {
      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
      this.update.postMessage({ action: 'SKIP_WAITING' });
    },
  },
  created() {
    const self = this;
    EventBus.$once('swUpdated', (event) => {
      self.update = event.waiting;
    });
  },
};
</script>

<style>
html,
body {
  overflow-y: scroll;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

html::-webkit-scrollbar,
body::-webkit-scrollbar {
  display: none; /* Chrome */
}

#background {
  width: 100%;
  height: 100%;
  position: fixed;
  left: 0px;
  top: 0px;
  background-image: url("/img/background.jpg");
  background-position: center;
  background-repeat: none;
  background-size: cover;
  z-index: -1; /* Ensure div tag stays behind content; -999 might work, too. */
}
</style>
