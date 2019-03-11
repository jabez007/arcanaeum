<template>
  <div>
    <Scene id="canvas"
           :height="windowHeight"
           ref="scene"
           fog="exp"
           :fogDensity="0.01"
           v-model="scene">
      <Camera v-model="camera"
              type="arcRotate" 
              :radius="20" 
              :position="[0, 0, -25]">
      </Camera>
      <HemisphericLight diffuse="#512da8"></HemisphericLight>
      <RotatingEntity :duration="60">
        <PointLight diffuse="#03a9f4"></PointLight>
        <RotatingEntity v-for="(box, key) in boxes"
                        :key="key"
                        :position="box.pos"
                        :duration="15">
          <Box v-model="nodes[key]">
            <Material :alpha="0.8">
            </Material>
          </Box>
        </RotatingEntity>
      </RotatingEntity>
    </Scene>
    <div ref="tooltip"
         id="tooltip">
    </div>    
  </div>
</template>

<script>
const BOXES = [
  {
    name: 'hello',
    pos: [4, 0, 0],
    to: '/hello'
  },
  {
    name: 'world',
    pos: [0, 4, 0],
    to: '/world'
  },
  {
    name: 'foo',
    pos: [0, 0, 4],
    to: '/foo'
  },
  {
    name: 'bar',
    pos: [-4, 0, 0],
    to: '/bar'
  },
  {
    name: 'good',
    pos: [0, -4, 0],
    to: '/good'
  },
  {
    name: 'bye',
    pos: [0, 0, -4],
    to: '/bye'
  },
]; 

export default {
  name: 'home',
  components: {
    RotatingEntity: () => import('@/components/RotatingEntity'),
  },
  data: () => ({
    windowHeight: 0,
    scene: null,
    camera: null,
    nodes: [],
  }),
  computed: {
    boxes() {
      return BOXES;
    }
  },
  watch: {
    scene() {
      // console.log('scene ready');
    },
    camera() {
      // console.log('camera ready');
      // cheat scene in here
      this.scene = this.scene || this.camera._scene;
    },
  },
  mounted() {
    const self = this;
    window.removeEventListener('click', this.pickMesh);
    window.addEventListener('click', this.pickMesh);
    window.removeEventListener('mousemove', this.showTooltip);
    window.addEventListener('mousemove', this.showTooltip);
    //
    this.windowHeight = window.innerHeight;
    window.addEventListener('resize', () => {
      self.windowHeight = window.innerHeight;
    });
  },
  beforeDestroy() {
    window.removeEventListener('click', this.pickMesh);
    window.removeEventListener('mousemove', this.showTooltip);
  },
  methods: {
    showTooltip() {
      if (this.$refs.tooltip) {
        const box = this.pickMesh();
        if (box.name) {
          this.$refs.tooltip.style.background = '#D1C4E9';
          this.$refs.tooltip.style.border = '1px solid #673ab7'
          this.$refs.tooltip.innerText = box.name;
        } else {
          this.$refs.tooltip.style.background = 'transparent';
          this.$refs.tooltip.style.border = '';
          this.$refs.tooltip.innerText = '';
        }
      }
    },
    pickMesh() {
      const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
      if (pickResult.hit) {
        const index = this.nodes.findIndex(n => n.id === pickResult.pickedMesh.id);
        if (index >= 0) {
          return BOXES[index];
        }
      }
      return {};
    }
  }
};
</script>

<style scoped>
#tooltip {
  position: absolute;
  top: 50%;
  right: 45%;
  min-width: 10%;
  border-radius: 25px;
  opacity: 0.5;
  color: #212121;
  font-size: large;
  font-family: Aclonica, Merienda, 'Lucida Sans Unicode', 'Lucida Grande', sans-serif;
  text-align: center;
  padding: 5px;
  margin: 0 auto;
}
</style>
