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
      ref="encryptContainer"
      class="encrypt-ciphertext"
      slot="encrypt-cipherText"
      slot-scope="scope"
      row
      justify-center
    >
      <v-flex shrink>
        <v-btn style="position: absolute;" icon @click="saveSvg(scope.cipherText)">
          <v-icon>save</v-icon>
        </v-btn>
        <canvas ref="encryptCiphertext" :width="width" :height="width" style="border:3px solid #000000;"></canvas>
      </v-flex>
    </v-layout>
    <svg-upload slot="decrypt-cipherText" @input="onDecryptInput"></svg-upload>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import C2S from 'canvas2svg';
import FileSaver from 'file-saver';
import {
  encrypt,
  enstegano,
  findSquareWidth,
} from '_/CryptoTron/ciphers/morellet';
import Cipher from '@/components/CryptoTron/Cipher.vue';
import SvgUpload from '@/components/CryptoTron/SvgUpload.vue';
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
    SvgUpload,
  },
  data: () => ({
    key: {
      colors: [purple, blue, green, yellow, orange, red],
    },
    context: null,
    width: 0,
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
  watch: {
    cipherSvg(newVal) {
      if (newVal === '' && this.cipherCanvg) {
        this.cipherCanvg.stop();
      }
    },
  },
  mounted() {
    const self = this;
    this.$nextTick(() => {
      setTimeout(() => {
        self.context = self.$refs.encryptCiphertext.getContext('2d');
        self.width = Math.min(
          self.$refs.encryptContainer.clientWidth,
          self.$refs.encryptContainer.clientHeight,
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
    onDecryptInput(canvas) {
      const squareWidth = findSquareWidth(canvas);
      console.log(squareWidth);
    },
  },
};
</script>

<style scoped>
.encrypt-ciphertext {
  min-height: 10rem;
}
</style>
