<template>
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
          <div class="cipher-svg">
            <canvas ref="decryptCiphertext"></canvas>
          </div>
        </v-flex>
      </v-fade-transition>
    </file-upload>
</template>

<script>
import Canvg from 'canvg';
import FileUpload from '@/components/FileUpload.vue';

export default {
  props: ['value'],
  components: {
    FileUpload,
  },
  data: () => ({
    cipherSvg: '',
    cipherCanvg: null,
  }),
  watch: {
    cipherSvg(newVal) {
      if (!newVal) {
        this.$emit('clear');
      }
    },
  },
  methods: {
    loadSvg(buffer) {
      const enc = new TextDecoder('utf-8');
      this.cipherSvg = enc.decode(buffer);
      const self = this;
      this.$nextTick(() => {
        self.cipherCanvg = Canvg.fromString(self.$refs.decryptCiphertext.getContext('2d'), self.cipherSvg);
        self.cipherCanvg.start();
        self.$emit('input', self.$refs.decryptCiphertext);
      });
    },
  },
};
</script>

<style scoped>
.cipher-svg {
  display: flex;
  align-content: center;
}
</style>
