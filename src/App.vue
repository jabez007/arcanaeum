<template>
  <div id="arcanaeum">
    <div id="background">
      <!--img src="/img/background.jpg" class="stretch" alt="" /-->
    </div>
    <transition name="scale-transition"
                mode="out-in">
      <router-view />
    </transition>
    <v-snackbar
      v-model="update"
      color="info"
      :timeout="0"
      top
    >
      <h3 style="font-family: Roboto">
        New content is available
      </h3>
      <v-btn
        icon
        @click="onRefresh"
      >
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
    update: false,
  }),
  methods: {
    onRefresh() {
      window.location.reload(true);
    },
  },
  created() {
    const self = this;
    EventBus.$once('swUpdated', () => {
      self.update = true;
    });
  },
};
</script>

<style>
/* html, body {
  margin: 0;
  padding: 0;
  height: 100%;
} */

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

.stretch {
  width: 100%;
  height: 100%;
}
</style>
