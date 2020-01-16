<template>
    <v-form ref="form">
      <v-text-field
        label="Key Text"
        v-model.trim="keyText"
        :rules="rules"
        @input="onInput"
        clearable
        required
      ></v-text-field>
    </v-form>
</template>

<script>
import Rules from '_/rules';
import mixin from './cipherKeysMixin';

export default {
  mixins: [mixin],
  data: () => ({
    keyText: '',
  }),
  computed: {
    rules() {
      return [
        Rules.required,
        value => !(value || '').replace(/[a-zA-Z\s.,?!'"]/g, '') || 'The value must be a text'];
    },
    key: {
      get() {
        const self = this;
        return {
          keyText: self.keyText,
        };
      },
      set(value) {
        if (value.keyText !== undefined && value.keyText !== this.keyText) {
          this.keyText = value.keyText;
        }
      },
    },
  },
};
</script>
