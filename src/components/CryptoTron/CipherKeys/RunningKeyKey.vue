<template>
    <v-form ref="form">
      <v-textarea
        label="Key Text"
        v-model.trim="key.keyText"
        :rules="rules"
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
  computed: {
    rules() {
      return [Rules.required];
    },
  },
};
</script>
