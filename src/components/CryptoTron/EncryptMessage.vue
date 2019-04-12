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
            v-bind="{ cipherText, copyToClipboard }">
        <v-textarea label="Cipher Text"
                    v-model="cipherText"
                    prepend-inner-icon="file_copy"
                    @click:prepend-inner="copyToClipboard(cipherText)"
                    outline
                    auto-grow
                    readonly>
        </v-textarea>
      </slot>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'EncryptMessage',
  props: {
    encryptAlgorithm: {
      type: Function,
      required: true,
    },
    cipherKey: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    plainText: '',
  }),
  computed: {
    cipherText() {
      return this.encryptAlgorithm(this.plainText, this.cipherKey);
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
  },
};
</script>

<style scoped>
</style>
