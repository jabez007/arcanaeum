<template>
    <v-form ref="form">
      <v-text-field
        label="Shift"
        type="number"
        v-model.number="shift"
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
    shift: 0,
  }),
  computed: {
    rules() {
      return [Rules.required, Rules.integer];
    },
    key: {
      get() {
        const self = this;
        return {
          shift: self.shift,
        };
      },
      set(value) {
        if (value.shift !== undefined && value.shift !== this.shift) {
          this.shift = value.shift;
        }
      },
    },
  },
};
</script>
