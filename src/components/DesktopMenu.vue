<template>
  <div>
    <Scene
      id="canvas"
      :height="windowHeight"
      ref="scene"
      fog="exp"
      :fogDensity="0.01"
      v-model="scene"
    >
      <Camera v-model="camera" type="arcRotate" :radius="20"></Camera>
      <HemisphericLight diffuse="#512da8"></HemisphericLight>
      <RotatingEntity :duration="60">
        <PointLight diffuse="#03a9f4"></PointLight>
        <RotatingEntity v-for="(box, key) in boxes" :key="key" :position="box.pos" :duration="15">
          <Box v-model="nodes[key]">
            <Material :alpha="0.8"></Material>
          </Box>
        </RotatingEntity>
      </RotatingEntity>
    </Scene>
    <div ref="tooltip" id="tooltip"></div>
  </div>
</template>

<script>
import {
  Entity,
  Scene,
  Camera,
  HemisphericLight,
  PointLight,
  Box,
  Material,
} from 'vue-babylonjs';

export default {
  props: {
    boxes: {
      type: Array,
      required: true,
    },
    isTouchDevice: {
      type: Boolean,
      default: false,
    },
  },
  mixins: [Entity],
  components: {
    Scene,
    Camera,
    HemisphericLight,
    PointLight,
    Box,
    Material,
    RotatingEntity: () => import('@/components/RotatingEntity'),
  },
  data: () => ({
    windowHeight: 0,
    scene: null,
    camera: null,
    nodes: [],
  }),
  watch: {
    scene() {
      // console.log('scene ready');
    },
    camera() {
      // console.log('camera ready');
      // cheat scene in here
      // eslint-disable-next-line no-underscore-dangle
      this.scene = this.scene || this.camera._scene;
    },
  },
  mounted() {
    const self = this;
    if (!this.isTouchDevice) {
      window.removeEventListener('click', this.navigateToBox);
      window.addEventListener('click', this.navigateToBox);
      //
      window.removeEventListener('mousemove', this.showTooltip);
      window.addEventListener('mousemove', this.showTooltip);
    }
    //
    this.windowHeight = window.innerHeight;
    window.addEventListener('resize', () => {
      self.windowHeight = window.innerHeight;
    });
  },
  beforeDestroy() {
    window.removeEventListener('click', this.navigateToBox);
    window.removeEventListener('mousemove', this.showTooltip);
  },
  methods: {
    pickMesh() {
      const pickResult = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY,
      );
      if (pickResult.hit) {
        const index = this.nodes.findIndex(
          n => n.id === pickResult.pickedMesh.id,
        );
        if (index >= 0) {
          return this.boxes[index];
        }
      }
      return {};
    },
    showTooltip() {
      if (this.$refs.tooltip) {
        const box = this.pickMesh();
        if (box.name) {
          this.$refs.tooltip.style.background = '#D1C4E9';
          this.$refs.tooltip.style.border = '1px solid #673ab7';
          this.$refs.tooltip.innerText = box.name;
        } else {
          this.$refs.tooltip.style.background = 'transparent';
          this.$refs.tooltip.style.border = '';
          this.$refs.tooltip.innerText = '';
        }
      }
    },
    navigateToBox() {
      const box = this.pickMesh();
      if (box.path) {
        this.$router.replace(box.path);
      }
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

#tooltip {
  position: absolute;
  top: 50%;
  right: 40%;
  min-width: 20%;
  border-radius: 25px;
  opacity: 0.5;
  color: #212121;
  font-size: large;
  font-family: Aclonica, Merienda, "Lucida Sans Unicode", "Lucida Grande",
    sans-serif;
  text-align: center;
  padding: 5px;
  margin: 0 auto;
}
</style>
