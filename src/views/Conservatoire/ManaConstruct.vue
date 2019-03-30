<template>
  <v-card width="100%" height="100%" style="overflow: hidden;">
    <v-card-title>
      <h6 class="title">Mana Construct Cure for the Creeping Corruption</h6>
    </v-card-title>
    <v-card-text>
      <p class="subheading">
        Discovered December of 265 with the final test of the solution done November of 266,
        <br /> 
        this was a cube of sorts of mana 'islands' that once unlocked, by connecting all of the 'islands' in a particular fashion,
        gave us a cure for the creeping corruption.
      </p>
      <p class="body-2">
        Chronicles and reports:
        <ul>
          <li><a href="http://lasthope.kitsufox.com/wiki/order-report-mana-construct-escort-mission-september-266/" target="_blank">Excort to New Hope</a></li>
          <li><a href="http://lasthope.kitsufox.com/wiki/order-report-corruption-cure-expedition-november-266/" target="_blank">Cure Expedition</a></li>
        </ul>
      </p>
      <p class="body-1">
        The goal was to connect all of the 'islands' by building a series of 'bridges' between the 'islands'.
        The 'bridges' must follow certain criteria:
        <ul>
          <li>They must begin and end at distinct 'islands', travelling a straight line in between.</li>
          <li>They must not cross any other 'bridges' or 'islands'.</li>
          <li>They may only run orthogonally (North-South or East-West).</li>
          <li>At most two 'bridges' connect a pair of 'islands'.</li>
          <li>The number of 'bridges' connected to each 'island' must match the number on that 'island'.</li>
          <li>The 'bridges' must connect the 'islands' into a single connected group.</li>
        </ul>
      </p>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn>Load</v-btn>
      <v-btn>Save</v-btn>
    </v-card-actions>
    <br />
    <v-layout row fill-height>
      <v-flex ref="konva" xs10 offset-xs1>
        <v-stage ref="stage" :config="konvaConfig">
          <v-layer v-for="(layer, k) in construct"
                   :key="`layer${k}`" 
                   :ref="`layer${k}`"
                   @click="onClick">
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
  [
    [4,0,0,2,0,3,0,2,0,2,0],
    [0,3,0,0,3,0,0,0,0,0,1],
    [4,0,0,2,0,0,3,0,0,4,0],
    [0,0,0,0,2,0,0,2,0,0,3],
    [0,3,0,6,0,3,0,0,0,3,0],
    [3,0,2,0,3,0,2,0,0,0,3],
    [0,5,0,1,0,2,0,4,0,3,0],
    [5,0,0,0,0,0,3,0,0,0,2],
    [0,4,0,0,4,0,0,1,0,0,0],
    [1,0,0,0,0,0,3,0,0,4,0],
    [0,1,0,2,0,3,0,2,0,0,5]
  ],
];

export default {
  data: () => ({
    konvaHeight: 0,
    konvaWidth: 0,
    slider: 1,
    sliderWidth: 0,
    lineStart: null,
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
      if ((0 < to && to <= this.construct.length) &&
          (0 < from && from <= this.construct.length)) {
        const toLayer = this.$refs[`layer${to - 1}`][0].getNode();
        toLayer.to({
          duration: 0.5,
          opacity: 1,
        });
        const fromLayer = this.$refs[`layer${from - 1}`][0].getNode();
        fromLayer.to({
          duration: 0.5,
          opacity: 0,
        });
        toLayer.moveToTop();
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
    const self = this;
    this.$nextTick(() => {
      for (let k = 0; k < self.construct.length; k += 1) {
        if (k + 1 !== self.slider) {
          self.$refs[`layer${k}`][0].getNode().opacity(0);
        } else if (k + 1 === self.slider) {
            self.$refs[`layer${k}`][0].getNode().moveToTop();
        }
      }
      self.$refs.stage.getNode().draw();
    });
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
    onClick(e) {
        const self = this;
        const group = e.target.getParent();
        if (!this.lineStart) {
            // start line creation
            this.lineStart = {
                x: group.x(),
                y: group.y(),
                z: self.slider
            };
            group.to({
                duration: 0.2, 
                shadowOffsetX: 15,
                shadowOffsetY: 15,
                scaleX: 1.2,
                scaleY: 1.2,
            });
        } else if (this.lineStart.z === self.slider) {
            // make sure we are in the same plane
            if (this.lineStart.x === group.x() && this.lineStart.y === group.y()) {
                // same node clicked, cancel line creation
                this.lineStart = null;
                group.to({
                    duration: 0.2,
                    shadowOffsetX: 5,
                    shadowOffsetY: 5,
                    scaleX: 1,
                    scaleY: 1,
                });
            } else if (this.lineStart.x === group.x() || this.lineStart.y === group.y()){
                // finish line creation
            } else {
                // diagonal lines don't work
            }
        } else {
            // lines between planes?
        }
        group.getParent().draw();
    },
    getKonvaLineConfig() {
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
