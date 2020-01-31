<template>
  <v-form ref="form">
    <v-layout row wrap>
      <v-flex xs12 md7>
        <v-layout row>
          <v-text-field
            label="Keyword"
            v-model.trim="compKeyword"
            :rules="keywordRules"
            required
            clearable
          ></v-text-field>
        </v-layout>
        <v-layout row>
          <v-text-field
            label="Ciphertext Characters"
            v-model.trim="key.cipherChars"
            maxlength="5"
            :rules="cipherCharRules"
            required
            clearable
          ></v-text-field>
        </v-layout>
      </v-flex>
      <v-spacer></v-spacer>
      <v-flex xs12 md3>
        <polybius-square :square="key.square" :cipherChars="key.cipherChars"></polybius-square>
      </v-flex>
    </v-layout>
  </v-form>
</template>

<script>
import Rules from '_/rules';
import { getUniqueCharacters } from '_/CryptoTron/ciphers';
import { square } from '_/CryptoTron/ciphers/polybius';
import PolybiusSquare from '@/components/CryptoTron/PolybiusSquare.vue';
import mixin from './cipherKeysMixin';

export default {
  mixins: [mixin],
  components: {
    PolybiusSquare,
  },
  data: () => ({
    keyword: '',
  }),
  computed: {
    keywordRules() {
      return [Rules.required, Rules.word];
    },
    cipherCharRules() {
      return [
        Rules.required,
        value => Rules.exactLength(5)(getUniqueCharacters(value)),
      ];
    },
    compKeyword: {
      get() {
        return this.key.keyword;
      },
      set(value) {
        this.key.keyword = value;
        this.key.square = square(value);
      },
    },
  },
  created() {
    this.key.cipherChars = 'ABCDE';
    this.key.square = square('');
  },
};
</script>
