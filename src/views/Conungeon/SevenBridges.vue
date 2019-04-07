<template>
  <v-card width="100%" height="100%" style="overflow: hidden;">
    <v-card-title>
      <h6 class="title">The Mana Bridges</h6>
    </v-card-title>
    <v-card-text>
      <p class="body-1"></p>
      <p>That is where you come in...</p>
    </v-card-text>
    <br>
    <v-layout row fill-height align-center align-content-center>
      <v-flex offset-xs1 fill-height ref="konva" style="color: gray;">
        <v-stage
          ref="stage"
          :config="{
                width: konvaWidth,
                height: konvaHeight,
            }"
        >
          <v-layer>
            <v-rect
              :config="{
                  width: konvaWidth,
                  height: konvaHeight,
                  cornerRadius: ((konvaWidth + konvaHeight) / 2) / 5, 
                  fillLinearGradientStartPoint: { x: konvaWidth * getRandom(1, 2), y: -(konvaHeight * getRandom(0, 1)) },
                  fillLinearGradientEndPoint: { x: -(konvaWidth * getRandom(0, 1)), y: konvaHeight * getRandom(1, 2) },
                  fillLinearGradientColorStops: [0, '#778899', 1, '#2F4F4F'],  // light slate gray -> dark slate gray
              }"
            ></v-rect>
          </v-layer>
          <v-layer ref="layer">
            <v-line
              ref="bridge1"
              :config="{
                points: [konvaCircleRadius, konvaHeight / 2, konvaWidth / 7, konvaHeight / 7, konvaWidth / 2, konvaCircleRadius],
                tension: 0.5,
                stroke: bridgeOffColor,
                strokeWidth: 11,
                lineCap: 'round',
              }"
              @click="handleClick"
            ></v-line>
            <v-line
              ref="bridge2"
              :config="{
                points: [konvaCircleRadius, konvaHeight / 2, konvaWidth / 3, konvaHeight / 3, konvaWidth / 2, konvaCircleRadius],
                tension: 0.5,
                stroke: bridgeOffColor,
                strokeWidth: 11,
                lineCap: 'round',
              }"
              @click="handleClick"
            ></v-line>

            <v-line
              ref="bridge3"
              :config="{
                points: [konvaWidth - konvaCircleRadius, konvaHeight / 2, konvaWidth - (konvaWidth / 7), konvaHeight / 7, konvaWidth / 2, konvaCircleRadius],
                tension: 0.5,
                stroke: bridgeOffColor,
                strokeWidth: 11,
                lineCap: 'round',
              }"
              @click="handleClick"
            ></v-line>
            <v-line
              ref="bridge4"
              :config="{
                points: [konvaWidth - konvaCircleRadius, konvaHeight / 2, konvaWidth - (konvaWidth / 3), konvaHeight / 3, konvaWidth / 2, konvaCircleRadius],
                tension: 0.5,
                stroke: bridgeOffColor,
                strokeWidth: 11,
                lineCap: 'round',
              }"
              @click="handleClick"
            ></v-line>

            <v-line
              ref="bridge5"
              :config="{
                points: [konvaWidth / 2, konvaCircleRadius, konvaWidth / 2, konvaHeight - konvaCircleRadius],
                stroke: bridgeOffColor,
                strokeWidth: 11,
                lineCap: 'round',
              }"
              @click="handleClick"
            ></v-line>

            <v-line
              ref="bridge6"
              :config="{
                points: [konvaCircleRadius, konvaHeight / 2, konvaWidth / 2, konvaHeight - konvaCircleRadius],
                stroke: bridgeOffColor,
                strokeWidth: 11,
                lineCap: 'round',
              }"
              @click="handleClick"
            ></v-line>

            <v-line
              ref="bridge7"
              :config="{
                points: [konvaWidth - konvaCircleRadius, konvaHeight / 2, konvaWidth / 2, konvaHeight - konvaCircleRadius],
                stroke: bridgeOffColor,
                strokeWidth: 11,
                lineCap: 'round',
              }"
              @click="handleClick"
            ></v-line>

            <v-ellipse
              :config="{
                x: konvaWidth / 2,
                y: konvaCircleRadius,
                radiusX: konvaCircleRadius * getRandom(0.5, 0.75),
                radiusY: konvaCircleRadius * getRandom(0.75, 1),
                rotation: 360 * getRandom(0, 1),
                fillLinearGradientStartPoint: { x: -(konvaCircleRadius * getRandom(0, 1)), y: -(konvaCircleRadius * getRandom(0, 1)) },
                fillLinearGradientEndPoint: { x: konvaCircleRadius * getRandom(1, 2), y: konvaCircleRadius * getRandom(1, 2) },
                fillLinearGradientColorStops: [0, 'blue', 1, 'purple'],
                shadowColor: 'black',
                shadowBlur: 10,
                shadowOffsetX: 5,
                shadowOffsetY: 5,
                shadowOpacity: 0.6
              }"
              @click="handleClick"
            ></v-ellipse>

            <v-ellipse
              :config="{
                x: konvaCircleRadius,
                y: konvaHeight / 2,
                radiusX: konvaCircleRadius * getRandom(0.75, 1),
                radiusY: konvaCircleRadius * getRandom(0.5, 0.75),
                rotation: 360 * getRandom(0, 1),
                fillLinearGradientStartPoint: { x: -(konvaCircleRadius * getRandom(0, 1)), y: -(konvaCircleRadius * getRandom(0, 1)) },
                fillLinearGradientEndPoint: { x: konvaCircleRadius * getRandom(1, 2), y: konvaCircleRadius * getRandom(1, 2) },
                fillLinearGradientColorStops: [0, 'blue', 1, 'purple'],
                shadowColor: 'black',
                shadowBlur: 10,
                shadowOffsetX: 5,
                shadowOffsetY: 5,
                shadowOpacity: 0.6
              }"
              @click="handleClick"
            ></v-ellipse>

            <v-ellipse
              :config="{
                x: konvaWidth - konvaCircleRadius,
                y: konvaHeight / 2,
                radiusX: konvaCircleRadius * getRandom(0.75, 1),
                radiusY: konvaCircleRadius * getRandom(0.5, 0.75),
                rotation: 360 * getRandom(0, 1),
                fillLinearGradientStartPoint: { x: -(konvaCircleRadius * getRandom(0, 1)), y: -(konvaCircleRadius * getRandom(0, 1)) },
                fillLinearGradientEndPoint: { x: konvaCircleRadius * getRandom(1, 2), y: konvaCircleRadius * getRandom(1, 2) },
                fillLinearGradientColorStops: [0, 'blue', 1, 'purple'],
                shadowColor: 'black',
                shadowBlur: 10,
                shadowOffsetX: 5,
                shadowOffsetY: 5,
                shadowOpacity: 0.6
              }"
              @click="handleClick"
            ></v-ellipse>

            <v-ellipse
              :config="{
                x: konvaWidth / 2,
                y: konvaHeight - konvaCircleRadius,
                radiusX: konvaCircleRadius * getRandom(0.5, 0.75),
                radiusY: konvaCircleRadius * getRandom(0.75, 1),
                rotation: 360 * getRandom(0, 1),
                fillLinearGradientStartPoint: { x: -(konvaCircleRadius * getRandom(0, 1)), y: -(konvaCircleRadius * getRandom(0, 1)) },
                fillLinearGradientEndPoint: { x: konvaCircleRadius * getRandom(1, 2), y: konvaCircleRadius * getRandom(1, 2) },
                fillLinearGradientColorStops: [0, 'blue', 1, 'purple'],
                shadowColor: 'black',
                shadowBlur: 10,
                shadowOffsetX: 5,
                shadowOffsetY: 5,
                shadowOpacity: 0.6
              }"
              @click="handleClick"
            ></v-ellipse>
          </v-layer>
        </v-stage>
      </v-flex>
    </v-layout>
  </v-card>
</template>

<script>
export default {
  name: "SevenBridges",
  data: () => ({
    konvaHeight: 0,
    konvaWidth: 0,
    bridgeOffColor: "#C4CED4", //silver
    bridgeOnColor: "#4169E1", // royal blue
    currentStone: null
  }),
  computed: {
    konvaCircleRadius() {
      return Math.floor(Math.min(this.konvaHeight, this.konvaWidth) / 7) / 2;
    }
  },
  mounted() {
    window.vueBridges = window.vueBridges || this;
    this.konvaWidth = Math.min(
      this.$refs.konva.clientWidth,
      this.$refs.konva.clientHeight
    );
    this.konvaHeight = Math.min(
      this.$refs.konva.clientWidth,
      this.$refs.konva.clientHeight
    );
  },
  beforeDestroy() {
    if (window.vueBridges === this) {
      window.vueBridges = null;
    }
  },
  methods: {
    getRandom(min, max) {
      return Math.random() * (max - min) + min;
    },
    handleClick(e) {
      if (!this.currentStone) {
        if (e.target.getClassName() === 'Ellipse') {
          const stone = e.target;
          console.log(stone.position());
        } else {
          // warning to click a starting stone
        }
      } else {
        if (e.target.getClassName() === 'Line') {
          const line = e.target;
          console.log(line.points());
        }
      }
    }
  }
};
</script>
