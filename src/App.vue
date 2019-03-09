<template>
  <div>
    <Scene id="canvas"
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
      <RotatingEntity>
        <PointLight diffuse="#03a9f4"></PointLight>
        <RotatingEntity v-for="(box, key) in boxes"
                        :key="key"
                        :position="box.pos">
          <Box v-model="nodes[key]">
            <Material :alpha="0.8">
            </Material>
          </Box>
        </RotatingEntity>
      </RotatingEntity>
    </Scene>
    <!-- div style="position: absolute; top: 100px; right: 100px;">
      hello world
    </div-->
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
  name: 'app',
  components: {
    RotatingEntity: () => import('./components/RotatingEntity'),
  },
  data: () => ({
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
    window.removeEventListener('click', this.pickMesh);
    window.addEventListener('click', this.pickMesh);
    window.removeEventListener('mousemove', this.pickMesh);
    window.addEventListener('mousemove', this.pickMesh);
  },
  methods: {
    pickMesh() {
      const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
      if (pickResult.hit) {
        const index = this.nodes.findIndex(n => n.id === pickResult.pickedMesh.id);
        if (index >= 0) {
          console.log(BOXES[index].to);
        }
      }
    }
  }
};
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

body {
  overflow: hidden;
}

/*#canvas {
  background-image: url('./assets/banner.jpg') !important;
}*/
</style>
