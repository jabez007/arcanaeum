<template>
  <v-card>
    <v-card-text>
      <slot name="cipherText"
            v-bind="{ cipherText }">
        <v-textarea label="Cipher Text"
                    v-model="cipherText"
                    auto-grow
                    clearable>
        </v-textarea>
      </slot>
      <slot name="plainText"
            v-bind="{ plainText, copyToClipboard, save }">
        <v-textarea label="Plain Text"
                    :value="plainText"
                    prepend-inner-icon="file_copy"
                    @click:prepend-inner="copyToClipboard(plainText)"
                    append-icon="save"
                    @click:append="save(plainText)"
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
  name: 'DecryptMessage',
  props: {
    decryptAlgorithm: {
      type: Function,
      required: true,
    },
    cipherKey: {
      type: [Object, Boolean], // either a valid key object or false
      required: true,
    },
  },
  data: () => ({
    cipherText: '',
  }),
  computed: {
    plainText() {
      if (this.cipherKey) {
        return this.decryptAlgorithm(this.cipherText, this.cipherKey);
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
      FileSaver.saveAs(blob, 'Plain.txt');
    },
  },
};
</script>

<style scoped>
</style>
