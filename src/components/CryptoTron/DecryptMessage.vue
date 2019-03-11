<template>
  <v-card>
    <v-card-text>
      <v-textarea label="Cipher Text"
                  v-model="cipherText"
                  auto-grow
                  clearable>
      </v-textarea>
      <v-textarea label="Plain Text"
                  :value="decryptAlgorithm(cipherText, cipherKey)"
                  prepend-inner-icon="file_copy"
                  @click:prepend-inner="copyToClipboard"
                  outline
                  auto-grow
                  readonly>
      </v-textarea>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'DecryptMessage',
  props: {
    decryptAlgorithm: {
      type: Function,
      required: true,
    },
    cipherKey: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    cipherText: '',
  }),
  methods: {
    copyToClipboard() {
      const self = this;
      this.$copyText(this.plainText)
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