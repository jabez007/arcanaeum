<template>
    <v-card style="width: 100%;">
        <v-card-title>
            <v-icon @click="addNode">add</v-icon>
            <v-select
              label="Cipher to Add"
              :items="ciphers"
              v-model="newCipher"
            ></v-select>
        </v-card-title>
        <v-card-text>
            <simple-flowchart :scene.sync="scene" @linkAdded="onLinkAdded"></simple-flowchart>
        </v-card-text>
    </v-card>
</template>

<script>
import SimpleFlowchart from 'vue-simple-flowchart';
import 'vue-simple-flowchart/dist/vue-flowchart.css';

export default {
  components: {
    SimpleFlowchart,
  },
  data: () => ({
    newCipher: '',
    scene: {
      centerX: 1024,
      centerY: 140,
      scale: 1,
      nodes: [],
      links: [],
    },
  }),
  computed: {
    ciphers() {
      return [
        'Affine',
        'Rail-Fence',
      ];
    },
  },
  methods: {
    addNode() {
      const maxID = Math.max(0, ...this.scene.nodes.map(link => link.id));
      const self = this;
      this.scene.nodes.push({
        id: maxID + 1,
        x: -400,
        y: 50,
        type: self.newCipher,
        label: `test${maxID + 1}`,
      });
    },
    onLinkAdded(newLink) {
      const self = this;
      function removeExisting(type) {
        const existing = self.scene.links.filter(l => l[type] === newLink[type]);
        if (existing.length > 1) {
          const existingIndex = self.scene.links.findIndex(l => l[type] === newLink[type]);
          self.scene.links.splice(existingIndex, 1);
        }
      }
      removeExisting('from');
      removeExisting('to');

      /*
       * and to avoid infinite loops,
       * there should always be fewer links than nodes
       */
      if (this.scene.links.length >= this.scene.nodes.length) {
        const newIndex = this.scene.links.findIndex(l => l.id === newLink.id);
        this.scene.links.splice(newIndex, 1);
      }
    },
  },
};
</script>

<style>
.node-label {
    color: black !important;
}
</style>
