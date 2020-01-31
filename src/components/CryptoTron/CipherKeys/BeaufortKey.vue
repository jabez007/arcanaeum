<template>
    <v-form ref="form">
      <v-text-field
        label="Keyword"
        v-model.trim="key.keyword"
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
