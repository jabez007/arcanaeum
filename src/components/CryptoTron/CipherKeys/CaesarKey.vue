<template>
    <v-form ref="form">
      <v-text-field
        label="Shift"
        type="number"
        v-model.number="key.shift"
        :rules="rules"
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
  computed: {
    rules() {
      return [Rules.required, Rules.integer];
    },
  },
};
</script>
