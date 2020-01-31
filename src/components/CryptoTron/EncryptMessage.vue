<template>
  <v-card>
    <v-card-text>
      <slot name="plainText"
            v-bind="{ plainText }">
        <v-textarea label="Plain Text"
                    v-model="plainText"
                    auto-grow
                    clearable>
        </v-textarea>
      </slot>
      <slot name="cipherText"
            v-bind="{ cipherText, copyToClipboard, save }">
        <v-textarea label="Cipher Text"
                    :value="cipherText"
                    prepend-inner-icon="file_copy"
                    @click:prepend-inner="copyToClipboard(cipherText)"
                    append-icon="save"
                    @click:append="save(cipherText)"
                    outline
                    auto-grow
                    readonly>
        </v-textarea>
      </slot>
    </v-card-text>
  </v-card>
</template>

<script>
import FileSaver from 'file-saver';

export default {
  name: 'EncryptMessage',
  props: {
    encryptAlgorithm: {
      type: Function,
      required: true,
    },
    cipherKey: {
      type: [Object, Boolean], // either a valid key object or false
      required: true,
    },
  },
  data: () => ({
    plainText: '',
  }),
  computed: {
    cipherText() {
      if (this.cipherKey) {
        return this.encryptAlgorithm(this.plainText, this.cipherKey);
      }
      return '';
    },
  },
  methods: {
    copyToClipboard(txt) {
      const self = this;
      this.$copyText(txt)
        .then(() => {
          self.$emit('success', 'copied!');
        })
        .catch((err) => {
          self.$emit('error', err.message);
        });
    },
    save(txt) {
      const blob = new Blob([txt], {
        type: 'text/plain;charset=utf-8',
      });
      FileSaver.saveAs(blob, 'Cipher.txt');
    },
  },
};
</script>

<style scoped>
</style>
