<template>
  <Cipher
    style="width: 100%;"
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="keys"
  >
    <v-card slot="description" style="width: 100%;">
      <v-card-title>
        <h5 class="headline">Combine Multiple Ciphers</h5>
      </v-card-title>
      <v-card-actions>
        <v-dialog v-model="openLoad" width="320">
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on">
              <v-icon>open_in_browser</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title>Open One of Your Algorithms</v-card-title>
            <v-card-text>
              <v-select label="Algorithm Name" :items="algorithmNames()" v-model="loadSelectValue"></v-select>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="onLoad">Open</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog v-model="openSave" width="320">
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on">
              <v-icon>save</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title>Save Your Algorithm</v-card-title>
            <v-card-text>
              <v-select
                label="Algorithm Name"
                :items="['', ...algorithmNames()]"
                v-model="saveSelectValue"
              >
                <template v-slot:selection="{ item, index }">
                  <v-text-field :value="item" @input="saveTextValue=$event" solo flat hide-details></v-text-field>
                </template>
              </v-select>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="onSave">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-select
          label="Cipher to Add"
          :items="Object.keys(ciphers)"
          v-model="newCipher"
          prepend-inner-icon="add"
          @click:prepend-inner="addNode"
          dense
        ></v-select>
        <v-dialog v-model="openShare" width="500">
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on">
              <v-icon>share</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <v-text-field
                label="Link to Algorithm"
                :value="algorithmLink"
                append-icon="file_copy"
                @click:append="copyLinkToClipboard()"
                readonly></v-text-field>
            </v-card-text>
            <v-expand-transition>
              <v-card-actions v-if="shareStatus && shareMessage">
                <v-alert style="width: 100%;" :value="shareStatus && shareMessage" :type="shareStatus">
                  {{ shareMessage }}
                </v-alert>
              </v-card-actions>
            </v-expand-transition>
          </v-card>
        </v-dialog>
        <v-spacer></v-spacer>
        <h6 v-if="algorithmName" class="title">{{ algorithmName }}</h6>
        <v-spacer></v-spacer>
        <v-btn icon @click="onClear">
          <v-icon>clear</v-icon>
        </v-btn>
      </v-card-actions>
      <v-card-text @mouseup="onMouseUp">
        <simple-flowchart
          :scene.sync="scene"
          @linkAdded="onLinkAdded"
          @linkBreak="onLinkBreak"
          @nodeClick="onNodeClick"
          @nodeDelete="onNodeDelete"
        ></simple-flowchart>
      </v-card-text>
      <v-dialog v-model="openDialog" width="915" persistent>
        <v-card>
          <v-card-title>
            {{ openNode.type }}
            <v-spacer></v-spacer>
            <v-icon @click="onDialogClose()">close</v-icon>
          </v-card-title>
          <v-card-text>
            <component :is="openNode.component" v-model="openNode.key"></component>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-card>
  </Cipher>
</template>

<script>
import SimpleFlowchart from 'vue-simple-flowchart';
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';
import AffineKey from '@/components/CryptoTron/CipherKeys/AffineKey.vue';
import * as Affine from '_/CryptoTron/ciphers/affine';
import AutokeyKey from '@/components/CryptoTron/CipherKeys/AutokeyKey.vue';
import * as Autokey from '_/CryptoTron/ciphers/autokey';
import BaconianKey from '@/components/CryptoTron/CipherKeys/BaconianKey.vue';
import * as Baconian from '_/CryptoTron/ciphers/baconian';
import CaesarKey from '@/components/CryptoTron/CipherKeys/CaesarKey.vue';
import * as Caesar from '_/CryptoTron/ciphers/caesar';
import ColumnarTranspositionKey from '@/components/CryptoTron/CipherKeys/ColumnarTranspositionKey.vue';
import * as ColumnarTransposition from '_/CryptoTron/ciphers/columnarTransposition';
import FourSquareKey from '@/components/CryptoTron/CipherKeys/FourSquareKey.vue';
import * as FourSquare from '_/CryptoTron/ciphers/fourSquare';
import HuffmanianKey from '@/components/CryptoTron/CipherKeys/HuffmanianKey.vue';
import * as Huffmanian from '_/CryptoTron/ciphers/huffmanian';
import PolybiusKey from '@/components/CryptoTron/CipherKeys/PolybiusKey.vue';
import * as Polybius from '_/CryptoTron/ciphers/polybius';
import RailFenceKey from '@/components/CryptoTron/CipherKeys/RailFenceKey.vue';
import * as RailFence from '_/CryptoTron/ciphers/railFence';
import SubstitutionKey from '@/components/CryptoTron/CipherKeys/SubstitutionKey.vue';
import * as Substitution from '_/CryptoTron/ciphers/substitution';
import 'vue-simple-flowchart/dist/vue-flowchart.css';

export default {
  props: {
    sharedJson: {
      type: String,
      required: false,
    },
  },
  components: {
    Cipher,
    SimpleFlowchart,
  },
  data: () => ({
    algorithmName: '',
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
    openSave: false,
    saveSelectValue: '',
    saveTextValue: '',
    openLoad: false,
    loadSelectValue: '',
    openShare: false,
    shareStatus: '',
    shareMessage: '',
  }),
  computed: {
    ciphers() {
      return {
        Affine: {
          component: AffineKey,
          encrypt: Affine.encrypt,
          decrypt: Affine.decrypt,
        },
        Autokey: {
          component: AutokeyKey,
          encrypt: Autokey.encrypt,
          decrypt: Autokey.decrypt,
        },
        Baconian: {
          component: BaconianKey,
          encrypt: Baconian.encrypt,
          decrypt: Baconian.decrypt,
        },
        Caesar: {
          component: CaesarKey,
          encrypt: Caesar.encrypt,
          decrypt: Caesar.decrypt,
        },
        'Columnar Transposition': {
          component: ColumnarTranspositionKey,
          encrypt: ColumnarTransposition.encrypt,
          decrypt: ColumnarTransposition.decrypt,
        },
        'Four-Square': {
          component: FourSquareKey,
          encrypt: FourSquare.encrypt,
          decrypt: FourSquare.decrypt,
        },
        Huffmanian: {
          component: HuffmanianKey,
          encrypt: Huffmanian.encrypt,
          decrypt: Huffmanian.decrypt,
        },
        Polybius: {
          component: PolybiusKey,
          encrypt: Polybius.encrypt,
          decrypt: Polybius.decrypt,
        },
        'Rail-Fence': {
          component: RailFenceKey,
          encrypt: RailFence.encrypt,
          decrypt: RailFence.decrypt,
        },
        Substitution: {
          component: SubstitutionKey,
          encrypt: Substitution.encrypt,
          decrypt: Substitution.decrypt,
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
    lastCipher() {
      /*
       * find the node such that there is link a 'to' but no link 'from'
       */
      const self = this;
      return this.scene.nodes
        .filter(n => self.scene.links.filter(l => l.to === n.id).length > 0)
        .filter(
          n => self.scene.links.filter(l => l.from === n.id).length === 0,
        );
    },
    keys() {
      // By definition if we have exactly 1 firstCipher, we have exactly 1 lastCipher
      return this.firstCipher.length !== 1
        ? false
        : this.scene.nodes.every(n => n.key);
    },
    jsonString() {
      const self = this;
      return JSON.stringify({
        nodes: [...self.scene.nodes],
        links: [...self.scene.links],
      });
    },
    algorithmLink() {
      return `${window.location.protocol}//${window.location.hostname}/#/cryptotron/builder/${btoa(this.jsonString)}`;
    },
  },
  watch: {
    saveSelectValue() {
      this.saveTextValue = '';
    },
    openShare() {
      this.shareStatus = '';
      this.shareMessage = '';
    },
  },
  created() {
    if (this.sharedJson) {
      const loadObj = JSON.parse(atob(this.sharedJson));
      this.addNodesFromJson(loadObj.nodes);
      this.scene.links.splice(0, this.scene.links.length, ...loadObj.links);
    }
  },
  methods: {
    encrypt(plainText) {
      let cipherText = this.firstCipher[0].encrypt(plainText);

      let nodeId = this.firstCipher[0].id;
      const links = [...this.scene.links];
      while (links.length > 0) {
        // find the link from the current node
        const linkIndex = links.findIndex(l => l.from === nodeId); // eslint-disable-line no-loop-func
        // pull that link out of the list
        const link = links.splice(linkIndex, 1)[0];
        // find the node that link connects to
        const node = this.scene.nodes.find(n => n.id === link.to);
        // encrypt message
        cipherText = node.encrypt(cipherText);
        // set nodeId for next run through
        nodeId = node.id;
      }

      return cipherText;
    },
    decrypt(cipherText) {
      let plainText = this.lastCipher[0].decrypt(cipherText);

      let nodeId = this.lastCipher[0].id;
      const links = [...this.scene.links];
      while (links.length > 0) {
        // find the link from the current node
        const linkIndex = links.findIndex(l => l.to === nodeId); // eslint-disable-line no-loop-func
        // pull that link out of the list
        const link = links.splice(linkIndex, 1)[0];
        // find the node that link connects from
        const node = this.scene.nodes.find(n => n.id === link.from);
        // decrypt message
        plainText = node.decrypt(plainText);
        // set nodeId for next run through
        nodeId = node.id;
      }

      return plainText;
    },
    addNode() {
      if (this.newCipher) {
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
                .filter(k => typeof this.key[k] !== 'object')
                .map(k => `${k}: ${this.key[k]}`)
                .join('\n')
              : '';
          },
          component: self.ciphers[self.newCipher].component,
          get encrypt() {
            return self.ciphers[this.type].encrypt(this.key);
          },
          get decrypt() {
            return self.ciphers[this.type].decrypt(this.key);
          },
        });
      }
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
    onClear() {
      this.scene.links.splice(0, this.scene.links.length);
      this.scene.nodes.splice(0, this.scene.nodes.length);
      this.algorithmName = '';
      this.saveTextValue = '';
      this.saveSelectValue = '';
    },
    algorithmNames() {
      return Object.keys(localStorage)
        .filter(k => k.startsWith('BYOA/'))
        .map(k => k.replace('BYOA/', ''));
    },
    onSave() {
      const saveAsName = this.saveTextValue.trim() || this.saveSelectValue;
      if (saveAsName) {
        this.algorithmName = saveAsName;
        localStorage.setItem(
          `BYOA/${saveAsName}`,
          this.jsonString,
        );
        this.openSave = false;
      }
    },
    addNodesFromJson(nodes) {
      const self = this;
      nodes.forEach((n) => {
        self.scene.nodes.push({
          id: n.id,
          x: n.x,
          y: n.y,
          type: n.type,
          component: self.ciphers[n.type].component,
          key: n.key,
          get label() {
            return this.key
              ? Object.keys(this.key)
                .filter(k => typeof this.key[k] !== 'object')
                .map(k => `${k}: ${this.key[k]}`)
                .join('\n')
              : '';
          },
          get encrypt() {
            return self.ciphers[this.type].encrypt(this.key);
          },
          get decrypt() {
            return self.ciphers[this.type].decrypt(this.key);
          },
        });
      });
    },
    onLoad() {
      const loadName = `BYOA/${this.loadSelectValue}`;
      if (Object.keys(localStorage).includes(loadName)) {
        this.onClear();
        this.algorithmName = this.loadSelectValue;
        this.saveSelectValue = this.loadSelectValue;
        const loadObj = JSON.parse(localStorage.getItem(loadName));
        this.addNodesFromJson(loadObj.nodes);
        this.scene.links.splice(0, this.scene.links.length, ...loadObj.links);
        this.openLoad = false;
      }
    },
    copyLinkToClipboard() {
      const self = this;
      this.$copyText(this.algorithmLink)
        .then(() => {
          self.shareStatus = 'success';
          self.shareMessage = 'copied!';
        })
        .catch((err) => {
          self.shareStatus = 'error';
          self.shareMessage = err.message;
        });
    },
  },
};
</script>

<style>
.node-main {
  max-height: 80px;
  overflow: hidden;
}

.node-label {
  color: black;
  white-space: pre-line; /* make HTML properly treat \n line breaks */
}
</style>
