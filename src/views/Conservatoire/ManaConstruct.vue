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
      <br />
      <p class="caption">
        hint: this puzzle is an <a href="https://en.wikipedia.org/wiki/Exact_cover">exact cover</a> problem
      </p>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="onLoad" 
             ripple
             round>
        <span class="hidden-md-and-down">Load</span>
        <v-icon class="hidden-md-and-up">open_in_browser</v-icon>
      </v-btn>
      <v-btn @click="onSave"
             ripple
             round>
        <span class="hidden-md-and-down">Save</span>
        <v-icon class="hidden-md-and-up">save</v-icon>
      </v-btn>
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
import Konva from 'konva'

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
  [
    [3,0,4,0,3,0,3,0,1,0,2],
    [0,5,0,2,0,2,0,2,0,2,0],
    [4,0,0,0,0,0,3,0,0,0,0],
    [0,2,0,0,0,3,0,3,0,0,3],
    [3,0,0,4,0,0,2,0,1,0,0],
    [0,0,0,0,0,0,0,0,0,1,0],
    [0,4,0,0,3,0,0,3,0,0,3],
    [5,0,0,3,0,4,0,0,0,2,0],
    [0,0,0,0,2,0,4,0,4,0,2],
    [0,2,0,3,0,2,0,0,0,2,0],
    [3,0,2,0,3,0,4,0,3,0,4],
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
    slider() {
      const self = this;
      for (let k = 0; k < this.construct.length; k += 1) {
        if (k + 1 !== this.slider) {
          this.$refs[`layer${k}`][0].getNode().to({
            duration: 0.5,
            opacity: 0,
          });
        } else if (k + 1 === this.slider) {
          const active = this.$refs[`layer${k}`][0].getNode();
          active.to({
            duration: 0.5,
            opacity: 1,
          });
          active.moveToTop();  // so clicks happen on this layer
          this.$nextTick(() => {
            active.getChildren(node => node.getClassName() === 'Line').forEach(line => {
              line.moveToBottom();
            });
            self.$refs.stage.getNode().draw();
          });
        }
      }
    },
  },
  mounted() {
    this.konvaWidth = this.$refs.konva.clientWidth;
    this.konvaHeight = this.$refs.konva.clientHeight;
    //
    this.sliderWidth = Math.min(this.konvaWidth, this.konvaHeight);
    //
    this.onLoad();
    //
    const self = this;
    this.$nextTick(() => {
      for (let k = 0; k < self.construct.length; k += 1) {
        if (k + 1 !== self.slider) {
          self.$refs[`layer${k}`][0].getNode().opacity(0);
        } else if (k + 1 === self.slider) {
            self.$refs[`layer${k}`][0].getNode().moveToTop();  // so clicks happen on this layer
        }
      }
      self.$refs.stage.getNode().draw();
    });
  },
  beforeDestroy() {
    this.onSave();
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
        opacity: 1,
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
        const layer = group.getParent();
        if (!this.lineStart) {
            // start line creation
            const currLines = layer.getChildren(node => node.getClassName() === 'Line' && node.name().includes(group.name()));
            // currLines.forEach(console.log);
            const maxLines = Number(group.getChildren(node => node.getClassName() === 'Text')[0].text());
            if (currLines.length < maxLines) {
                // this node can accept another line
                this.lineStart = {
                    name: group.name(),
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
            }
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
                let currLines = layer.getChildren(node => node.getClassName() === 'Line' && node.name().includes(group.name()));
                // currLines.forEach(console.log);
                const maxLines = Number(group.getChildren(node => node.getClassName() === 'Text')[0].text());
                if (currLines.length < maxLines) {
                    // this node can accept another line
                    const lineName = [this.lineStart.name, group.name()].sort().join();
                    // how do we check for crossed nodes or crossed lines?
                    const currLines = layer.getChildren(node => node.name() === lineName);
                    // currLines.forEach(console.log);
                    if (currLines.length < 2) {
                        // we haven't reached our max yet
                        const lineWidth = Math.floor(self.konvaCircleRadius / 4);
                        const newLine = new Konva.Line({
                            name: lineName,
                            points: [self.lineStart.x, self.lineStart.y, group.x(), group.y()],
                            stroke: "#C4CED4", //silver
                            strokeWidth: lineWidth,
                            lineCap: 'round',
                            lineJoin: 'round'
                            });
                        newLine.on('click', this.deleteLine);
                        if (currLines.length === 0) {
                            // this is our first line between these nodes
                            //layer.add(newLine);
                            //newLine.moveToBottom();
                        } else if (currLines.length === 1) {
                            // this is our second line between these nodes
                            const oldLine = currLines[0];
                            if (this.lineStart.x === group.x()) {
                                // both nodes in same column, so shift x
                                oldLine.move({
                                    x: -lineWidth,
                                    y: 0
                                });
                                newLine.move({
                                    x: lineWidth,
                                    y: 0
                                });
                            } else if (this.lineStart.y === group.y()) {
                                // both nodes in same row, so shift y
                                oldLine.move({
                                    x: 0,
                                    y: -lineWidth
                                });
                                newLine.move({
                                    x: 0,
                                    y: lineWidth
                                });
                            }
                        }
                        layer.add(newLine);
                        newLine.moveToBottom();
                    }
                    this.lineStart = null;
                    layer.getChildren(node => node.getClassName() === 'Group').forEach(node => {
                        node.to({
                            duration: 0.2,
                            shadowOffsetX: 5,
                            shadowOffsetY: 5,
                            scaleX: 1,
                            scaleY: 1,
                        });
                    });
                }
            } else {
                // diagonal lines don't work
            }
        } else {
            // lines between planes?
        }
    },
    deleteLine(e) {
        const toDelete = e.target;
        const lineName = toDelete.name();
        const layer = toDelete.getParent();
        toDelete.destroy();
        layer.getChildren(node => node.name() === lineName).forEach(node => {
            const pos = node.position();
            node.position({
                x: pos.x - pos.x,
                y: pos.y - pos.y
            });
        });
        layer.draw();
    },
    onSave() {
      for (let k = 0; k < this.construct.length; k += 1) {
        const lines = this.$refs[`layer${k}`][0].getNode()
          .getChildren(node => node.getClassName() === 'Line')
          .map(line => line.toJSON());
        localStorage.setItem(`construct_layer${k}_lines`, JSON.stringify(lines));
      }
    },
    onLoad() {
      const self = this;
      for (let k = 0; k < this.construct.length; k += 1) {
        const lines = JSON.parse(localStorage.getItem(`construct_layer${k}_lines`) || '[]');
        const layer = this.$refs[`layer${k}`][0].getNode();
        lines.forEach(line => {
          const loadLine = Konva.Line.create(line);
          loadLine.on('click', self.deleteLine);
          layer.add(loadLine);
          self.$nextTick(() => {
            loadLine.moveToBottom();
            layer.draw();
          });
        });
      }
    },
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
