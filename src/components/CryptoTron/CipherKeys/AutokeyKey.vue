<template>
    <v-form ref="form">
      <v-text-field
        label="Primer"
        v-model.trim="primer"
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
    primer: '',
  }),
  computed: {
    rules() {
      return [Rules.required, Rules.word];
    },
    key: {
      get() {
        const self = this;
        return {
          primer: self.primer,
        };
      },
      set(value) {
        if (value.primer !== undefined && value.primer !== this.primer) {
          this.primer = value.primer;
        }
      },
    },
  },
};
</script>
