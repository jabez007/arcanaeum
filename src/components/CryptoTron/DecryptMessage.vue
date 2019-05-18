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
            v-bind="{ plainText, copyToClipboard }">
        <v-textarea label="Plain Text"
                    :value="plainText"
                    prepend-inner-icon="file_copy"
                    @click:prepend-inner="copyToClipboard(plainText)"
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
  computed: {
    plainText() {
      return this.decryptAlgorithm(this.cipherText, this.cipherKey);
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
