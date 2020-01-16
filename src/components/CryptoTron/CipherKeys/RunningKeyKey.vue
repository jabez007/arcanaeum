<template>
    <v-form ref="form">
      <v-textarea
        label="Key Text"
        v-model.trim="keyText"
        :rules="rules"
        @input="onInput"
        rows="1"
        auto-grow
        clearable
        required
      ></v-textarea>
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
      return [Rules.required];
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
