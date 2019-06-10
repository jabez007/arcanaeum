<template>
  <v-card width="100%" height="100%" style="overflow: hidden;">
    <v-card-title>
      <h6 class="title">The Seven Channels of Mana</h6>
    </v-card-title>
    <v-card-text>
      <p class="body-1">
        Recovered by one of our Medicum while harvesting medicinal plants from the mountains around the Spire,
        this granite apparatus holds four mana stones with seven channels carved into the granite connecting the stones.
        Upon our analysis of the design,
        it was quickly understood that one could channel mana into any single stone of the four,
        then move the mana from stone to stone by way of the channels in the granite.
        It was witnessed that the movement of mana through a granite channel would thus 'activate' the channel.
        But, moving mana through an already 'active' channel would lead to its 'deactivation'.
        It is believed the goal of this appliance is for all the granite channels to be 'activated',
        but for what end we do not grasp yet.
        Not that the outcome of this 'activation' matters so long as the path to it remains hidden.
      </p>
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
                stroke: channelOffColor,
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
                stroke: channelOffColor,
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
                stroke: channelOffColor,
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
                stroke: channelOffColor,
                strokeWidth: 11,
                lineCap: 'round',
              }"
              @click="handleClick"
            ></v-line>

            <v-line
              ref="bridge5"
              :config="{
                points: [konvaWidth / 2, konvaCircleRadius, konvaWidth / 2, konvaHeight - konvaCircleRadius],
                stroke: channelOffColor,
                strokeWidth: 11,
                lineCap: 'round',
              }"
              @click="handleClick"
            ></v-line>

            <v-line
              ref="bridge6"
              :config="{
                points: [konvaCircleRadius, konvaHeight / 2, konvaWidth / 2, konvaHeight - konvaCircleRadius],
                stroke: channelOffColor,
                strokeWidth: 11,
                lineCap: 'round',
              }"
              @click="handleClick"
            ></v-line>

            <v-line
              ref="bridge7"
              :config="{
                points: [konvaWidth - konvaCircleRadius, konvaHeight / 2, konvaWidth / 2, konvaHeight - konvaCircleRadius],
                stroke: channelOffColor,
                strokeWidth: 11,
                lineCap: 'round',
              }"
              @click="handleClick"
            ></v-line>

            <v-ellipse
              :config="{
                x: konvaWidth / 2,
                y: konvaCircleRadius,
                radiusX: konvaCircleRadius * getRandom(0.75, 1),
                radiusY: konvaCircleRadius * getRandom(0.375, 0.5),
                rotation: 90 * getRandom(0, 1),
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
                radiusX: konvaCircleRadius * getRandom(0.375, 0.5),
                radiusY: konvaCircleRadius * getRandom(0.75, 1),
                rotation: 90 * getRandom(0, 1),
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
                radiusX: konvaCircleRadius * getRandom(0.375, 0.5),
                radiusY: konvaCircleRadius * getRandom(0.75, 1),
                rotation: 90 * getRandom(0, 1),
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
                radiusX: konvaCircleRadius * getRandom(0.75, 1),
                radiusY: konvaCircleRadius * getRandom(0.375, 0.5),
                rotation: 90 * getRandom(0, 1),
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
// eslint-disable-next-line import/no-extraneous-dependencies
import Random from '_/random';

export default {
  name: 'SevenBridges',
  data: () => ({
    konvaHeight: 0,
    konvaWidth: 0,
    channelOffColor: 'rgba(196,206,212,1)', // silver
    channelOnColor: 'rgba(65,105,225,1)', // royal blue
    currentStone: null,
  }),
  computed: {
    konvaCircleRadius() {
      return Math.floor(Math.min(this.konvaHeight, this.konvaWidth) / 7) / 2;
    },
  },
  mounted() {
    window.vueBridges = window.vueBridges || this;
    this.konvaWidth = Math.min(
      this.$refs.konva.clientWidth,
      this.$refs.konva.clientHeight,
    );
    this.konvaHeight = Math.min(
      this.$refs.konva.clientWidth,
      this.$refs.konva.clientHeight,
    );
  },
  beforeDestroy() {
    if (window.vueBridges === this) {
      window.vueBridges = null;
    }
  },
  methods: {
    getRandom(min, max) {
      return Random.number(min, max);
    },
    handleClick(e) {
      if (!this.currentStone) {
        if (e.target.getClassName() === 'Ellipse') {
          const stone = e.target;
          // console.log(stone.position());
          stone.to({
            duration: 0.5,
            shadowOffsetX: 15,
            shadowOffsetY: 15,
          });
          this.currentStone = stone;
        } else {
          // warning to click a starting stone
        }
      } else if (e.target.getClassName() === 'Line') {
        const line = e.target;
        const layer = line.getParent();
        const linePoints = line.points();
        // console.log(linePoints);
        const start = { x: linePoints[0], y: linePoints[1] };
        const end = { x: linePoints[linePoints.length - 2], y: linePoints[linePoints.length - 1] };
        // console.log(start, end);
        const currentPosition = this.currentStone.position();
        // console.log(currentPosition);
        let nextStone = null;
        if (currentPosition.x === start.x && currentPosition.y === start.y) {
          nextStone = layer.findOne(node => node.getClassName('Ellipse') && node.position().x === end.x && node.position().y === end.y);
        } else if (currentPosition.x === end.x && currentPosition.y === end.y) {
          nextStone = layer.findOne(node => node.getClassName('Ellipse') && node.position().x === start.x && node.position().y === start.y);
        }
        if (nextStone) {
          // console.log(nextStone.position());
          this.currentStone.to({
            duration: 0.25,
            shadowOffsetX: 5,
            shadowOffsetY: 5,
          });
          nextStone.to({
            duration: 0.25,
            shadowOffsetX: 15,
            shadowOffsetY: 15,
          });
          this.currentStone = nextStone;
          // console.log(line.stroke());
          line.to({
            duration: 0.25,
            stroke: line.stroke() === this.channelOffColor ? this.channelOnColor : this.channelOffColor,
          });
        }
      }
    },
  },
};
</script>
