<template>
    <v-form ref="form">
      <v-text-field
        label="Keyword"
        v-model.trim="keyword"
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
    keyword: '',
  }),
  computed: {
    rules() {
      return [Rules.required, Rules.word];
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
