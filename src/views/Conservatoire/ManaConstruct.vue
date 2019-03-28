<template>
  <v-card width="100%" height="100%" style="overflow: hidden;">
    <v-card-title>
      <h1>hello world</h1>
    </v-card-title>
    <v-card-text>
      <p>description...</p>
      <p>more description...</p>
    </v-card-text>
    <v-card-actions>
      actions...
    </v-card-actions>
    <v-layout row fill-height>
      <v-flex ref="konva" xs10 offset-xs1>
        <v-stage ref="stage" :config="konvaConfig">
          <v-layer v-for="(layer, k) in construct"
                   :key="`layer${k}`" 
                   :ref="`layer${k}`">
            <template v-for="(row, j) in layer">
              <v-group v-for="(node, i) in row"
                       v-if="node > 0"
                       :key="`node${i}${j}${k}`"
                       :ref="`node${i}${j}${k}`"
                       :config="getKonvaGroupConfig(i, j)">
                <v-circle :config="getKonvaCircleConfig()"/>
                <v-text :config="getKonvaTextConfig(node)"/>
              </v-group>
            </template>
          </v-layer>
        </v-stage>
      </v-flex>
      <v-flex xs1>
        <div class="vertical-slider">
          <v-slider v-model="slider"
                    :style="`width: ${sliderWidth}px;`"
                    :max="construct.length"
                    min="1"
                    readonly
                    prepend-icon="remove"
                    @click:prepend="slider -= 1"
                    append-icon="add"
                    @click:append="slider += 1"
                    thumb-label="always"
                    always-dirty>
          </v-slider>
        </div>
      </v-flex>
    </v-layout>
  </v-card>
</template>

<script>
const CONSTRUCT = [
  [
    [3,0,0,3,0,0,2,0,1,0,0],
    [0,2,0,0,0,3,0,5,0,0,3],
    [2,0,0,0,0,0,0,0,0,0,0],
    [0,3,0,3,0,4,0,7,0,0,5],
    [2,0,2,0,3,0,2,0,1,0,0],
    [0,2,0,0,0,2,0,5,0,4,0],
    [0,0,0,2,0,0,1,0,0,0,2],
    [2,0,0,0,0,3,0,6,0,4,0],
    [0,2,0,0,0,0,0,0,0,0,2],
    [2,0,0,3,0,3,0,5,0,4,0],
    [0,0,1,0,2,0,2,0,2,0,3],
  ],
];

export default {
  data: () => ({
    konvaHeight: 0,
    konvaWidth: 0,
    slider: 1,
    sliderWidth: 0
  }),
  computed: {
    construct() {
      return CONSTRUCT;
    },
    dim() {
      return this.construct[0].length;
    },
    konvaConfig() {
      const self = this;
      return {
        width: Math.min(self.konvaWidth, self.konvaHeight),
        height: Math.min(self.konvaWidth, self.konvaHeight)
      };
    },
    konvaCircleRadius() {
      return Math.floor(
        Math.min(this.konvaWidth, this.konvaHeight) / this.dim / 2
      );
    }
  },
  watch: {
    slider(to, from) {
      if ((to <= this.construct.length && from <= this.construct.length) &&
          (to > 0 && from > 0)) {
        const toLayer = this.$refs[`layer${to - 1}`].getNode();
        toLayer.to({
          duration: 0.5,
          opacity: 1,
        });
        const fromLayer = this.$refs[`layer${from - 1}`].getNode();
        fromLayer.to({
          duration: 0.5,
          opacity: 0,
        });
        this.$refs.stage.getNode().draw();
      }
    },
  },
  mounted() {
    this.konvaWidth = this.$refs.konva.clientWidth;
    this.konvaHeight = this.$refs.konva.clientHeight;
    //
    this.sliderWidth = Math.min(this.konvaWidth, this.konvaHeight);
    //
    for (let k = 0; k < this.construct.length; k += 1) {
      if (k + 1 !== this.slider) {
        this.$refs[`layer${k}`].getNode().opacity(0);
      }
    }
  },
  methods: {
    getKonvaGroupConfig(i, j) {
      const self = this;
      return {
        name: `group${i}${j}`,
        x: (self.konvaCircleRadius * i) + (self.konvaCircleRadius * (i + 1)),
        y: (self.konvaCircleRadius * j) + (self.konvaCircleRadius * (j + 1)),
      };
    },
    getKonvaCircleConfig() {
      const self = this;
      return {
        x: 0,
        y: 0,
        radius: self.konvaCircleRadius,
        fill: "#0077C0", // blue
        opacity: 0.8,
        shadowColor: "black",
        shadowBlur: 10,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
        shadowOpacity: 0.6
      };
    },
    getKonvaTextConfig(node) {
      const self = this;
      return {
        x: -(node < 10 ? (self.konvaCircleRadius / 3.33) : (self.konvaCircleRadius / 1.67)),
        y: -(self.konvaCircleRadius / 2),
        text: `${node}`,
        fontSize: self.konvaCircleRadius,
        align: 'center',
        verticalAlign: 'middle',
        fontFamily: 'courier',  // monospaced font
        fill: "#C4CED4", //silver
      };
    },
    getKonvaLineConfig() {
      const self = this;
      return {
        stroke: "#C4CED4" //silver
      };
    }
  }
};
</script>

<style>
.vertical-slider {
  position: relative;
}

.vertical-slider .v-input--slider {
  position: absolute;
  top: -3em;
  right: 1em;
  transform: rotate(270deg);
  transform-origin: right;
}

.vertical-slider .v-slider__thumb-label span {
  transform: rotate(45deg);
}

.vertical-slider .v-input__icon {
  transform: rotate(90deg);
}
</style>
