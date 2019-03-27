<template>
<v-flex xs12>
    <v-layout column>
        <v-card>
          <v-card-title>
            <h1>hello world</h1>
          </v-card-title>
          <v-card-text></v-card-text>
          <v-layout ref="konvaRow" 
                    row 
                    fill-height>
            <v-flex ref="konva" d-flex xs11>
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
          <v-card-actions></v-card-actions>
        </v-card>
    </v-layout>
</v-flex>
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
        width: self.konvaWidth,
        height: self.konvaHeight
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
    //
    this.sliderWidth = this.$refs.konvaRow.clientHeight;
    //
    const self = this;
    this.$watch("$refs.konvaRow.clientHeight", (newVal) => {
      // console.log("new slider width!");
      self.sliderWidth = newVal;
    });
    this.$watch("$refs.konva.clientHeight", (newVal) => {
      // console.log("new konva height!");
      self.konvaHeight = newVal;
    });
    this.$watch("$refs.konva.clientWidth", (newVal) => {
      // console.log("new konva width!");
      self.konvaWidth = newVal;
    });
  },
  methods: {
    getKonvaGroupConfig(i) {
      return {
        name: "groupi",
        x: 50,
        y: 50
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
        x: 0,
        y: 0,
        text: `${i}`,
        fontSize: 15
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
  right: 2em;
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
