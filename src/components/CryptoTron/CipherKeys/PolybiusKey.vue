<template>
  <v-form ref="form">
    <v-layout row wrap>
      <v-flex xs12 md7>
        <v-layout row>
          <v-text-field
            label="Keyword"
            v-model.trim="keyword"
            :rules="keywordRules"
            @input="onInput"
            required
            clearable
          ></v-text-field>
        </v-layout>
        <v-layout row>
          <v-text-field
            label="Ciphertext Characters"
            v-model.trim="cipherChars"
            maxlength="5"
            :rules="cipherCharRules"
            @input="onInput"
            required
            clearable
          ></v-text-field>
        </v-layout>
      </v-flex>
      <v-spacer></v-spacer>
      <v-flex xs12 md3>
        <table style="table-layout:fixed; width: 100px;">
          <thead>
            <tr>
              <td></td>
              <td v-for="c in 5" :key="c" style="color:red;">{{ (cipherChars || '').charAt(c - 1) }}</td>
            </tr>
          </thead>
          <tr v-for="r in 5" :key="r">
            <td style="color:red;">{{ (cipherChars || '').charAt(r - 1) }}</td>
            <td v-for="c in 5" :key="c">{{ square[r-1][c-1] }}</td>
          </tr>
        </table>
      </v-flex>
    </v-layout>
  </v-form>
</template>

<script>
import Rules from '_/rules';
import { getUniqueCharacters } from '_/CryptoTron/ciphers';
import { square } from '_/CryptoTron/ciphers/polybius';
import mixin from './cipherKeysMixin';

export default {
  mixins: [mixin],
  data: () => ({
    keyword: '',
    cipherChars: 'ABCDE',
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
    square() {
      return square(this.keyword);
    },
    chars() {
      return (this.cipherChars || '').substring(0, 5);
    },
    key: {
      get() {
        const self = this;
        return {
          keyword: self.keyword,
          square: self.square,
          cipherChars: self.chars,
        };
      },
      set(value) {
        if (value.keyword !== undefined && value.keyword !== this.keyword) {
          this.keyword = value.keyword;
        }
        if (
          value.square !== undefined
          && !value.square.every((arr, r) => arr.every((e, c) => e === this.square[r][c]))
        ) {
          this.keyword = value.square.map(r => r.join('')).join('');
        }
        if (
          value.cipherChars !== undefined
          && value.cipherChars !== this.cipherChars
        ) {
          this.cipherChars = value.cipherChars;
        }
      },
    },
  },
};
</script>
