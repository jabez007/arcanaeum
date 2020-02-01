<template>
  <Cipher :encryptAlgorithm="encrypt" :decryptAlgorithm="decrypt" :cipherKey="cipherKey">
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Morellet Cipher</h5>
      </v-card-title>
      <v-card-text></v-card-text>
    </v-card>
    <morellet-key slot="key" v-model="key"></morellet-key>
    <v-layout
      ref="container"
      class="container"
      slot="encrypt-cipherText"
      slot-scope="scope"
      row
      justify-center
    >
      <v-flex shrink>
        <v-btn style="position: absolute;" icon @click="saveSvg(scope.cipherText)">
          <v-icon>save</v-icon>
        </v-btn>
        <canvas ref="doodle" :width="width" :height="width" style="border:3px solid #000000;"></canvas>
      </v-flex>
    </v-layout>
    <file-upload
      slot="decrypt-cipherText"
      accept="image/svg+xml"
      @load="loadSvg"
      :disabled="!!cipherSvg"
    >
      <v-fade-transition leave-absolute>
        <v-flex v-if="!!cipherSvg" shrink>
          <v-btn style="position: absolute;" icon @click="cipherSvg = ''">
            <v-icon>close</v-icon>
          </v-btn>
          <div class="cipher-svg" v-html="cipherSvg"></div>
        </v-flex>
      </v-fade-transition>
    </file-upload>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import C2S from 'canvas2svg';
import FileSaver from 'file-saver';
import { encrypt, enstegano } from '_/CryptoTron/ciphers/morellet';
import FileUpload from '@/components/FileUpload.vue';
import Cipher from '@/components/CryptoTron/Cipher.vue';
import MorelletKey from '@/components/CryptoTron/CipherKeys/MorelletKey.vue';

const blue = '#006597';
const orange = '#ff5c30';

const yellow = '#ffd652';
const purple = '#562b42';

const red = '#df2933';
const green = '#177b4b';

export default {
  components: {
    Cipher,
    MorelletKey,
    FileUpload,
  },
  data: () => ({
    key: {
      colors: [purple, blue, green, yellow, orange, red],
    },
    context: null,
    width: 0,
    cipherSvg: '',
  }),
  computed: {
    cipherKey() {
      const self = this;
      return {
        ...self.key,
        ...{
          context: self.context,
          width: self.width,
        },
      };
    },
    rowLength() {
      return Math.ceil(Math.sqrt(this.ciphertext.length));
    },
    squareLength() {
      return this.width / (this.rowLength || 1);
    },
  },
  mounted() {
    const self = this;
    this.$nextTick(() => {
      setTimeout(() => {
        self.context = self.$refs.doodle.getContext('2d');
        self.width = Math.min(
          self.$refs.container.clientWidth,
          self.$refs.container.clientHeight,
        );
      }, 100);
    });
  },
  methods: {
    encrypt(plainText, key) {
      return encrypt(key)(plainText);
    },
    decrypt(cipherText) {
      return cipherText || 'Not Implemented Yet';
    },
    saveSvg(encodedString) {
      const self = this;
      const svgCtx = new C2S(self.width, self.width);
      const cipherKey = {
        ...self.key,
        ...{
          context: svgCtx,
          width: self.width,
        },
      };
      enstegano(cipherKey)(encodedString);
      const blob = new Blob([svgCtx.getSerializedSvg()], {
        type: 'text/plain;charset=utf-8',
      });
      FileSaver.saveAs(blob, 'Cipher.svg');
    },
    loadSvg(buffer) {
      const enc = new TextDecoder('utf-8');
      this.cipherSvg = enc.decode(buffer);
    },
  },
};
</script>

<style scoped>
.container {
  min-height: 10rem;
}

.cipher-svg {
  display: flex;
  align-content: center;
}
</style>
