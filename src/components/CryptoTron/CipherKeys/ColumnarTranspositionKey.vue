<template>
  <v-form ref="form">
    <v-layout row>
      <v-text-field
        label="Key Word"
        v-model.trim="key.keyword"
        :rules="rules"
        required
        clearable
      ></v-text-field>
    </v-layout>
    <v-layout row>
      <v-text-field
        label="Sorted"
        :value="(key.keyword || '').toLowerCase().split('').sort().join('')"
        disabled
        readonly
      ></v-text-field>
    </v-layout>
  </v-form>
</template>

<script>
import Rules from '_/rules';
import mixin from './cipherKeysMixin';

export default {
  mixins: [mixin],
  computed: {
    rules() {
      return [Rules.required, Rules.word, Rules.minLength(2)];
    },
  },
};
</script>
