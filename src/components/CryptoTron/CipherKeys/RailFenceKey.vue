<template>
    <v-form ref="form">
      <v-text-field
        label="Number of Rails"
        type="number"
        v-model.number="rails"
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
    rails: 1,
  }),
  computed: {
    rules() {
      return [Rules.required, Rules.integer, Rules.positive];
    },
    key: {
      get() {
        const self = this;
        return {
          rails: self.rails,
        };
      },
      set(value) {
        if (value.rails !== undefined && value.rails !== this.rails) {
          this.rails = value.rails;
        }
      },
    },
  },
};
</script>
