<template>
  <v-form ref="form">
    <v-layout row>
      <v-text-field
        label="Key Word"
        v-model.trim="keyword"
        :rules="rules"
        @input="onInput"
        required
        clearable
      ></v-text-field>
    </v-layout>
    <v-layout row>
      <v-text-field
        label="Sorted"
        :value="(keyword || '').toLowerCase().split('').sort().join('')"
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
  data: () => ({
    keyword: '',
  }),
  computed: {
    rules() {
      return [Rules.required, Rules.word, Rules.minLength(2)];
    },
    key: {
      get() {
        const self = this;
        return {
          keyword: self.keyword,
        };
      },
      set(value) {
        if (value.keyword !== undefined && value.keyword !== this.keyword) {
          this.keyword = value.keyword;
        }
      },
    },
  },
};
</script>
