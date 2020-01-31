<template>
    <v-form ref="form">
      <v-text-field
        label="Primer"
        v-model.trim="key.primer"
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
      return [Rules.required, Rules.word];
    },
  },
};
</script>
