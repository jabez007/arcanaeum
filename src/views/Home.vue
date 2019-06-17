<template>
  <div id="aether">
    <Scene v-if="!isMobile()"
           id="canvas"
           :height="windowHeight"
           ref="scene"
           fog="exp"
           :fogDensity="0.01"
           v-model="scene">
      <Camera v-model="camera"
              type="arcRotate"
              :radius="20">
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
    <div v-if="isMobile()"
         id="mobileMenu">
      <div>
        <div v-for="(box, key) in boxes.filter(b => b.name)"
             :key="key">
          <div>
            <button @click="$router.push(box.path)">
              {{ box.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div ref="tooltip"
         id="tooltip">
    </div>
  </div>
</template>

<script>
const BOXES = [
  {
    path: '/cryptotron/about',
    name: 'CryptoTron',
    pos: [4, 0, 0],
  },
  {
    path: '/conservatoire/about',
    name: 'Conservatoire',
    pos: [-4, 0, 0],
  },
  {
    path: '/oracle',
    name: 'Oracle',
    pos: [0, 4, 0],
  },
  {
    path: '/quotidian',
    name: 'Quotidian Schemer',
    pos: [0, -4, 0],
  },
  {
    path: '/conungeon/about',
    name: 'The Conungeon',
    pos: [0, 0, 4],
  },
  {
    path: '',
    name: '',
    pos: [0, 0, -4],
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
    },
  },
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
    if (!this.isMobile()) {
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
    isMobile() {
      return window.innerWidth < 600;
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
#aether {
  width: 100%;
  height: 100%;
  position: fixed;
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
  font-family: Aclonica, Merienda, 'Lucida Sans Unicode', 'Lucida Grande', sans-serif;
  text-align: center;
  padding: 5px;
  margin: 0 auto;
}

#mobileMenu {
  width: 100%;
  height: 100%;
  background: #512da8;
  opacity: 0.9;
}

#mobileMenu > div {
  width: 50%;
  height: 100%;
  margin: 0 auto;
  border-radius: 25px;
  background: #03a9f4;
  opacity: 0.9;
  box-shadow: 5px 5px 5px rgba(0,0,0, 0.5);
  display: table;
}

#mobileMenu > div > div {
  display: table-row;
}

#mobileMenu > div > div > div {
  display: table-cell;
  vertical-align: middle;
}

#mobileMenu button {
  width: 100%;
  padding: 5px;
  border: 1px solid #673ab7;
  border-radius: 25px;
  background: #D1C4E9;
  opacity: 0.9;
  box-shadow: 5px 5px 5px rgba(0,0,0, 0.5);
  text-align: center;
  color: #212121;
  font-size: large;
  font-family: Aclonica, Merienda, 'Lucida Sans Unicode', 'Lucida Grande', sans-serif;
}
</style>
