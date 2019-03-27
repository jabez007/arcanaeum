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
          <v-layer ref="layer">
            <v-group
              v-for="i in slider"
              :key="`node${i}`"
              :ref="`node${i}`"
              :config="getKonvaGroupConfig(i)"
            >
              <v-circle :config="getKonvaCircleConfig(i)"/>
              <v-text :config="getKonvaTextConfig(i)"/>
            </v-group>
          </v-layer>
        </v-stage>
      </v-flex>
      <v-flex xs1>
        <div class="vertical-slider">
          <v-slider
            v-model="slider"
            :style="`width: ${sliderWidth}px;`"
            max="11"
            min="1"
            readonly
            prepend-icon="remove"
            @click:prepend="slider -= 1"
            append-icon="add"
            @click:append="slider += 1"
            thumb-label="always"
            always-dirty
          ></v-slider>
        </div>
      </v-flex>
    </v-layout>
  </v-card>
</template>

<script>
export default {
  data: () => ({
    konvaHeight: 0,
    konvaWidth: 0,
    slider: 1,
    sliderWidth: 0
  }),
  computed: {
    konvaConfig() {
      const self = this;
      return {
        width: Math.min(self.konvaWidth, self.konvaHeight),
        height: Math.min(self.konvaWidth, self.konvaHeight)
      };
    },
    konvaCircleRadius() {
      return Math.floor(
        Math.min(this.konvaWidth, this.konvaHeight) / this.slider / 2
      );
    }
  },
  mounted() {
    this.konvaWidth = this.$refs.konva.clientWidth;
    this.konvaHeight = this.$refs.konva.clientHeight;
    this.sliderWidth = Math.min(this.konvaWidth, this.konvaHeight);
  },
  methods: {
    getKonvaGroupConfig(i) {
      const self = this;
      return {
        name: `group${i}`,
        x: (self.konvaCircleRadius * (i - 1)) + (self.konvaCircleRadius * i),
        y: (self.konvaCircleRadius * (i - 1)) + (self.konvaCircleRadius * i)
      };
    },
    getKonvaCircleConfig(i) {
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
    getKonvaTextConfig(i) {
      const self = this;
      return {
        x: -(i < 10 ? (self.konvaCircleRadius / 3.33) : (self.konvaCircleRadius / 1.67)),
        y: -(self.konvaCircleRadius / 2),
        text: `${i}`,
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
