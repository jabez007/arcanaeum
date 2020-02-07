<template>
  <Cipher :encryptAlgorithm="encrypt" :decryptAlgorithm="decrypt" :cipherKey="cipherKey">
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Morellet Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The Morellet cipher is a method of steganography (a method of hiding a secret message as opposed to just a cipher) inspired by
          <a href="https://maxhalford.github.io/blog/morellet-crosses-with-javascript/"
          >Morellet Crosses</a> using a
          <a
            href="https://en.wikipedia.org/wiki/Huffman_coding"
          >Huffman encoding</a> in
          <a
            href="https://en.wikipedia.org/wiki/Senary"
          >Senary</a>.
          That means we can map each letter of the English alphabet onto a variable length sequence of colors from the six colors given in the key.
          This allows more common letters (like E and T) to be encoded using shorter sequences of colors, or even just a single color,
          while the least common letters (like Z) are encoded using longer sequences.
        </p>
        <p>
          This cipher offers very little communication security, as it is a substitution cipher.
          As such all the methods used to cryptanalyse substitution ciphers can be used to break Baconian, Huffmanian, and Morellet ciphers.
          The main advantage of the cipher is that it allows hiding the fact that a secret message has been sent at all.
        </p>
      </v-card-text>
    </v-card>
    <morellet-key slot="key" v-model="key"></morellet-key>
    <v-layout ref="encryptContainer" slot="encrypt-cipherText" slot-scope="scope" row wrap justify-center>
      <v-flex xs12 md6>
        <v-textarea label="Encoding" v-model="scope.cipherText" outline auto-grow readonly></v-textarea>
      </v-flex>
      <v-flex class="encrypt-ciphertext" xs12 md6>
        <div>
          <v-btn style="position: absolute;" icon @click="saveSvg(scope.cipherText)">
            <v-icon>save</v-icon>
          </v-btn>
          <canvas
            ref="encryptCiphertext"
            :width="width"
            :height="width"
            style="border:3px solid #000000;"
          ></canvas>
        </div>
      </v-flex>
    </v-layout>
    <svg-upload slot="decrypt-cipherText" @input="onDecryptInput" @clear="plainText = ''"></svg-upload>
    <v-layout slot="decrypt-plainText" slot-scope="scope" row wrap>
      <v-textarea
        label="Plain Text"
        :value="plainText"
        prepend-inner-icon="file_copy"
        @click:prepend-inner="scope.copyToClipboard(plainText)"
        append-icon="save"
        @click:append="scope.save(plainText)"
        outline
        auto-grow
        readonly
      ></v-textarea>
    </v-layout>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import C2S from 'canvas2svg';
import FileSaver from 'file-saver';
import { encrypt, enstegano, decode } from '_/CryptoTron/ciphers/morellet';
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
    plainText: '',
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
    decrypt() {
      return '';
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
      this.plainText = canvas ? decode(canvas, this.key) : '';
    },
  },
};
</script>

<style scoped>
.encrypt-ciphertext {
  display: flex;
  justify-content: center;
}
</style>
