<template>
  <v-card width="100%" height="100%" style="overflow: hidden;">
    <v-card-title>
      <h6 class="title">The Fifteen Mana Stone Tablet</h6>
    </v-card-title>
    <v-card-text>
      <p class="body-1">
        Unearthed by the Magi of the Archons while reconnoitring the mountains around the Spire,
        this slate tablet has fifteen chiseled stones mounted to it in a grid-like fashion.
        It was quickly discovered that these sculpted stones could not be removed from the slate by any means known to the Magi,
        but could be slid along the surface of the tablet to rearrange the order of the lattice structure.
        After much tinkering with this atifact at the Spire,
        we have come to the conclusion that the tablet is a key of some sort activated by properly aligning the array of hewn stones, 
        but to what this key unlocks we have yet to ascertain.
        Thus far, the Magi's attempts to achieve the precise distribution required of the fasioned stones have,
        each time, resulted in all but two stones in their correct place.
      </p>
      <p>That is where you come in...</p>
    </v-card-text>
    <br>
    <v-layout row fill-height align-center align-content-center>
      <v-flex offset-xs1 fill-height ref="konva" style="color: gray;">
        <v-stage ref="stage" :config="konvaConfig">
          <v-layer>
            <v-rect
              :config="{
                  width: konvaGroupWidth * 4,
                  height: konvaGroupWidth * 4,
                  cornerRadius: konvaGroupWidth / 3, 
                  fillLinearGradientStartPoint: { x: (konvaGroupWidth * 4) * getRandom(1, 2), y: -((konvaGroupWidth * 4) * getRandom(0, 1)) },
                  fillLinearGradientEndPoint: { x: -((konvaGroupWidth * 4) * getRandom(0, 1)), y: (konvaGroupWidth * 4) * getRandom(1, 2) },
                  fillLinearGradientColorStops: [0, '#778899', 1, '#2F4F4F'],  // light slate gray -> dark slate gray
              }"
            ></v-rect>
            <v-rect
              :config="{
                  width: konvaGroupWidth * 4,
                  height: konvaGroupWidth * 4,
                  cornerRadius: konvaGroupWidth / 3, 
                  fillPatternImage = backgroundImage,
                  fillScale: { x: (konvaGroupWidth * 4) / 1080, y: (konvaGroupWidth * 4) / 1080 }, 
              }"
            ></v-rect>
          </v-layer>
          <v-layer ref="layer">
            <template v-for="j in 4">
              <template v-for="i in 4">
                <v-group
                  :key="`${i}${j}`"
                  :ref="getKonvaNodeRef(i, j)"
                  :config="{
                    x: (i - 1) * konvaGroupWidth,
                    y: (j - 1) * konvaGroupWidth
                  }"
                  @click="handleClick"
                >
                  <v-ellipse
                    v-if="4 * (j - 1) + i != 16"
                    :config="{
                        x: konvaGroupWidth / 2,
                        y: konvaGroupWidth / 2,
                        radiusX: (konvaGroupWidth / 2) * getRandom(0.75, 1),
                        radiusY: (konvaGroupWidth / 2) * getRandom(0.5, 0.75),
                        rotation: 360 * getRandom(0, 1),
                        fillLinearGradientStartPoint: { x: -(konvaGroupWidth * getRandom(0, 1)), y: -(konvaGroupWidth * getRandom(0, 1)) },
                        fillLinearGradientEndPoint: { x: konvaGroupWidth * getRandom(1, 2), y: konvaGroupWidth * getRandom(1, 2) },
                        fillLinearGradientColorStops: [0, 'blue', 1, 'purple'],
                        opacity: getRandom(0.5, 0.75),
                        shadowColor: 'black',
                        shadowBlur: 10,
                        shadowOffsetX: 5,
                        shadowOffsetY: 5,
                        shadowOpacity: 0.6
                    }"
                  ></v-ellipse>
                  <v-text
                    v-if="4 * (j - 1) + i != 16"
                    :config="{
                        width: konvaGroupWidth,
                        height: konvaGroupWidth,
                        fontSize: konvaGroupWidth / 2,
                        align: 'center',
                        verticalAlign: 'middle',
                        fontFamily: 'courier',  // monospaced font
                        fill: '#C4CED4', //silver
                        text: getKonvaTextText(i, j)
                    }"
                  ></v-text>
                </v-group>
              </template>
            </template>
          </v-layer>
        </v-stage>
      </v-flex>
    </v-layout>
  </v-card>
</template>

<script>
export default {
  name: "FifteenPuzzle",
  data: () => ({
    konvaHeight: 0,
    konvaWidth: 0,
    backgroundImage: null,
    puzzlePieces: new Array(15).fill(null),
  }),
  computed: {
    konvaConfig() {
      const self = this;
      return {
        width: Math.min(self.konvaWidth, self.konvaHeight),
        height: Math.min(self.konvaWidth, self.konvaHeight)
      };
    },
    konvaGroupWidth() {
      return Math.floor(Math.min(this.konvaWidth, this.konvaHeight) / 4);
    }
  },
  created() {
    const self = this;
    const backgroundImage = new Image();
    backgroundImage.src = require('@/assets/Conungeon/FifteenPuzzle/circle of life.png');
    bacgroundImage.onLoad = () => {
      self.backgroundImage = backgroundImage;
    };
  },
  mounted() {
    window.vueFifteen = window.vueFifteen || this;
    this.konvaWidth = this.$refs.konva.clientWidth;
    this.konvaHeight = this.$refs.konva.clientHeight;
  },
  beforeDestroy() {
      if (window.vueFifteen === this) {
          window.vueFifteen = null;
      }
  },
  methods: {
    getKonvaNodeRef(i, j) {
      const key = 4 * (j - 1) + i;
      if (key != 16) {
        if (key === 14) {
          return "node15";
        } else if (key === 15) {
          return "node14";
        } else {
          return `node${key}`;
        }
      } else {
        return "empty";
      }
    },
    getRandom(min, max) {
      return Math.random() * (max - min) + min;
    },
    getKonvaTextText(i, j) {
      const key = 4 * (j - 1) + i;
      if (key != 16) {
        if (key === 14) {
          return "15";
        } else if (key === 15) {
          return "14";
        } else {
          return key;
        }
      } else {
        return "";
      }
    },
    handleClick(e) {
      const group = e.target.getParent();
      const groupX = this.konvaGroupWidth * Math.round(group.position().x / this.konvaGroupWidth),
        groupY = this.konvaGroupWidth * Math.round(group.position().y / this.konvaGroupWidth);
      // console.log(groupX, groupY);
      // find the empty group
      const empty = this.$refs["empty"][0].getNode();
      const emptyX = this.konvaGroupWidth * Math.round(empty.position().x / this.konvaGroupWidth),
        emptyY = this.konvaGroupWidth * Math.round(empty.position().y / this.konvaGroupWidth);
      // console.log(emptyX, emptyY);
      // is the empty group next to the clicked group?
      const xDiff = groupX - emptyX,
        yDiff = groupY - emptyY;
      //
      if (
        Math.abs(xDiff) === this.konvaGroupWidth ||
        Math.abs(yDiff) === this.konvaGroupWidth
      ) {
        // ignore diagonals
        if (
          !(
            Math.abs(xDiff) >= this.konvaGroupWidth &&
            Math.abs(yDiff) >= this.konvaGroupWidth
          )
        ) {
          group.to({
            duration: 0.5,
            x: groupX - xDiff,
            y: groupY - yDiff
          });
          empty.to({
            duration: 0.5,
            x: emptyX + xDiff,
            y: emptyY + yDiff
          });
          // const layer = group.getParent();
          // layer.draw();
        }
      }
    }
  }
};
</script>
