<template>
  <div style="width: 100%;">
    <v-card style="width: 100%;">
      <v-card-title>
        <v-icon @click="addNode">add</v-icon>
        <v-select label="Cipher to Add" :items="Object.keys(ciphers)" v-model="newCipher"></v-select>
      </v-card-title>
      <v-card-text @mouseup="onMouseUp">
        <simple-flowchart
          :scene.sync="scene"
          @linkAdded="onLinkAdded"
          @linkBreak="onLinkBreak"
          @nodeClick="onNodeClick"
          @nodeDelete="onNodeDelete"
        ></simple-flowchart>
      </v-card-text>
    </v-card>
    <v-dialog v-model="openDialog" width="500" persistent>
      <v-card>
        <v-card-title>
          {{ openNode.type }}
          <v-spacer></v-spacer>
          <v-icon @click="onDialogClose()">close</v-icon>
        </v-card-title>
        <v-card-text>
            <component :is="openNode.component" v-model="openNode.key"></component>
        </v-card-text>
        <v-card-actions v-if="openNode.encrypt && openNode.key">
            {{ openNode.encrypt('hello world') }}
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import SimpleFlowchart from 'vue-simple-flowchart';
import AffineKey from '@/components/CryptoTron/CipherKeys/AffineKey.vue';
import * as Affine from '_/CryptoTron/ciphers/affine';
import RailFenceKey from '@/components/CryptoTron/CipherKeys/RailFenceKey.vue';
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
    openDialog: false,
    openNode: {},
  }),
  computed: {
    ciphers() {
      return {
        Affine: {
          component: AffineKey,
          encrypt: Affine.encrypt,
          decrypt: Affine.decrypt,
        },
        'Rail-Fence': {
          component: RailFenceKey,
        },
      };
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
        type: `${self.newCipher}`,
        get label() {
          return this.key
            ? Object.keys(this.key)
              .map(k => `${k}: ${this.key[k]}`)
              .join('\n')
            : '';
        },
        component: self.ciphers[self.newCipher].component,
        get encrypt() {
          return self.ciphers[self.newCipher].encrypt(this.key);
        },
        get decrypt() {
          return self.ciphers[self.newCipher].decrypt(this.key);
        },
      });
    },
    onLinkAdded(newLink) {
      const self = this;
      function removeExisting(type) {
        const existing = self.scene.links.filter(
          l => l[type] === newLink[type],
        );
        if (existing.length > 1) {
          const existingIndex = self.scene.links.findIndex(
            l => l[type] === newLink[type],
          );
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
      const connectedNodes = this.scene.nodes.filter(n => this.scene.links.find(l => l.from === n.id || l.to === n.id));
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
    onNodeClick(nodeId) {
      const nodeIndex = this.scene.nodes.findIndex(n => n.id === nodeId);
      this.openNode = this.scene.nodes[nodeIndex];
    },
    onMouseUp() {
      this.openDialog = this.openNode.id !== undefined;
    },
    onDialogClose() {
      this.openDialog = false;
      const nodeIndex = this.scene.nodes.findIndex(
        n => n.id === this.openNode.id,
      );
      this.scene.nodes.splice(nodeIndex, 1, this.openNode);
      this.openNode = {};
    },
    onNodeDelete(nodeId) {
      if (this.openNode.id === nodeId) {
        this.openNode = {};
      }
    },
  },
};
</script>

<style>
.node-label {
  color: black !important;
  white-space: pre-line; /* make HTML properly treat \n line breaks */
}
</style>
