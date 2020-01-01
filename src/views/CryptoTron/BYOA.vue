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
            <simple-flowchart :scene.sync="scene" @linkAdded="onLinkAdded" @linkBreak="onLinkBreak"></simple-flowchart>
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
    firstCipher() {
      /*
       * find the node such that there is link a 'from' but no link 'to'
       */
      const self = this;
      return this.scene.nodes
        .filter(n => self.scene.links.filter(l => l.from === n.id).length > 0)
        .filter(n => self.scene.links.filter(l => l.to === n.id).length === 0);
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
       * To avoid a disconnected graph
       * i.e. multiple starting points
       * make sure there is only one
       */
      if (this.firstCipher.length > 1) {
        const newIndex = this.scene.links.findIndex(l => l.id === newLink.id);
        this.scene.links.splice(newIndex, 1);
      }

      /*
       * and to avoid infinite loops,
       * there should always be fewer links than nodes
       */
      const connectedNodes = this.scene.nodes
        .filter(n => this.scene.links.find(l => l.from === n.id || l.to === n.id));
      if (this.scene.links.length >= connectedNodes.length) {
        const newIndex = this.scene.links.findIndex(l => l.id === newLink.id);
        this.scene.links.splice(newIndex, 1);
      }
    },
    onLinkBreak(oldLink) {
      /*
       * To avoid a disconnected graph
       * i.e. multiple starting points
       * make sure there is only one
       */
      if (this.firstCipher.length > 1) {
        this.scene.links.push(oldLink);
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
