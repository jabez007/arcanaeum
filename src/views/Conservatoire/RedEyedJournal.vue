<template>
  <v-card height="100%">
    <v-card-title>
      <h6 class="title">The Syndar Journal</h6>
    </v-card-title>
    <v-card-text ref="cardText">
      <p class="subheading">
        A journal discovered sometime in 263,
        believed to belong to the one know as "The Red-Eyed Syndar",
        detailing the initial observations of and eventual interaction with a tribe of Mordok
      </p>
      <div ref="journal" class="flipbook-viewport" :style="zoomStyle()">
        <div class="container">
          <div class="flipbook">
            <div class="hard"></div>
            <div class="hard"></div>
            <div v-for="entry in journal" :key="entry.title">
              <div>
                <h3 v-html="entry.title"></h3>
                <br />
                <div v-html="entry.contents"></div>
              </div>
            </div>
            <div v-if="journal.length % 2 !== 0"></div>
            <div class="hard"></div>
            <div class="hard"></div>
          </div>
        </div>
        <v-btn icon small color="primary" class="zoom-button" @click="zoom = !zoom">
          <v-icon v-if="zoom === false">zoom_in</v-icon>
          <v-icon v-if="zoom === true">zoom_out</v-icon>
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import jQuery from 'jquery';
import turn from '@/assets/Conservatoire/turn';
import JOURNAL from '@/assets/Conservatoire/Journal';

turn(jQuery);

const $ = jQuery;

export default {
  name: 'SyndarJournals',
  data: () => ({
    zoom: false,
  }),
  computed: {
    journal() {
      return JOURNAL;
    },
  },
  watch: {
    zoom(newVal) {
      if (newVal) {
        const toolbarOffset = this.$vuetify.breakpoint.smAndDown ? 64 : 88;
        window.scrollTo(
          0,
          (this.$refs.journal.offsetTop + toolbarOffset) - (window.innerHeight - this.$refs.journal.clientHeight) / 2,
        );
        // disable scroll when zoomed in
        const x = window.scrollX;
        const y = window.scrollY;
        window.onscroll = () => {
          window.scrollTo(x, y);
        };
      } else {
        // enable scrolling when not zoomed in
        window.onscroll = () => {};
      }
    },
  },
  mounted() {
    const pageHeight = Math.min(
      this.$refs.cardText.clientHeight,
      (window.clientHeight || window.innerHeight) * 0.75,
    );
    const bookWidth = Math.min(
      2 * (pageHeight * (8.5 / 11)),
      this.$refs.cardText.clientWidth * 0.7,
    );
    // console.log(bookWidth, pageHeight);
    $('.flipbook').turn({
      width: bookWidth,
      height: pageHeight,
    });
  },
  beforeDestroy() {
    // make sure scrolling is enabled before leaving
    window.onscroll = () => {};
  },
  methods: {
    zoomStyle() {
      const clientHeight = (window.clientHeight || window.innerHeight);
      if (this.$refs.journal) {
        const scale = clientHeight / this.$refs.journal.clientHeight;
        // console.log(scale);
        return this.zoom
          ? {
            'z-index': 99,
            transform: `scale(${scale}, ${scale}) translate(2vw, 0)`,
            '-webkit-transform': `scale(${scale}, ${scale}) translate(2vw, 0)`,
          }
          : {};
      }
      return {};
    },
  },
};
</script>

<style scoped>
@font-face {
  font-family: "Aclonica";
  font-display: swap;
  src: local("Aclonica"),
    url(https://fonts.gstatic.com/s/aclonica/v9/K2FyfZJVlfNNSEBXGY7UAo8.woff2)
      format("woff2");
}

@font-face {
  font-family: "Merienda";
  font-display: swap;
  src: local("Merienda"),
    url(https://fonts.gstatic.com/s/merienda/v7/gNMHW3x8Qoy5_mf8uWMFMIo.woff2)
      format("woff2");
}

.flipbook-viewport {
  overflow: hidden;
  width: 100%;
  height: 100%;
  position: relative;
  transition: 1s;
  -webkit-transition: 1s;
}

.zoom-button {
  position: absolute;
  left: 28vw;
  bottom: 5%;
}

.flipbook-viewport .container {
  position: relative;
  top: 0%;
  left: 0%;
  margin: auto;
  transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
}

.flipbook-viewport .flipbook {
  width: 100%;
  height: 100%;
  left: 0px;
  top: 0px;
}

.flipbook-viewport .page {
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  font-family: Aclonica, Merienda, "Lucida Sans Unicode", "Lucida Grande",
    sans-serif;
  color: rgb(0, 64, 64);
  background-attachment: fixed;
  background-image: url("../../assets/Conservatoire/parchment.jpg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.flipbook-viewport .page div {
  padding: 5px !important;
}

.flipbook .hard {
  overflow: hidden;
  background-attachment: fixed;
  background-blend-mode: darken;
  background-color: rgba(0, 0, 0, 0.5);
  background-image: url("../../assets/Conservatoire/leather.jpg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  color: #333;
  -webkit-box-shadow: inset 0 0 5px #666;
  -moz-box-shadow: inset 0 0 5px #666;
  -o-box-shadow: inset 0 0 5px #666;
  -ms-box-shadow: inset 0 0 5px #666;
  box-shadow: inset 0 0 5px #666;
  font-weight: bold;
}

.flipbook .page {
  -webkit-box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  -moz-box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  -ms-box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  -o-box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

.flipbook-viewport .page img {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  margin: 0;
}

.flipbook-viewport .shadow {
  -webkit-transition: -webkit-box-shadow 0.5s;
  -moz-transition: -moz-box-shadow 0.5s;
  -o-transition: -webkit-box-shadow 0.5s;
  -ms-transition: -ms-box-shadow 0.5s;

  -webkit-box-shadow: 0 0 20px #ccc;
  -moz-box-shadow: 0 0 20px #ccc;
  -o-box-shadow: 0 0 20px #ccc;
  -ms-box-shadow: 0 0 20px #ccc;
  box-shadow: 0 0 20px #ccc;
}
</style>
