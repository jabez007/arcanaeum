<template>
  <v-form ref="form">
    <v-layout row>
      <div>
        <v-chip
          v-for="char in plainAlphabet"
          :key="char.toUpperCase()"
          style="margin: 1px !important; font-family: monospace, monospace;"
          label
          small
        >{{ char.toUpperCase() }}</v-chip>
      </div>
    </v-layout>
    <v-layout row>
      <draggable v-model="cipherAlphabet" group="cipherAlphabet">
        <transition-group>
          <v-chip
            v-for="char in cipherAlphabet"
            :key="char"
            color="info"
            style="margin: 1px !important; font-family: monospace, monospace;"
            label
            small
          >{{ char }}</v-chip>
        </transition-group>
      </draggable>
    </v-layout>
    <v-layout row>
      <v-text-field label="Key Word" v-model.trim="keyword" @input="onInput" clearable></v-text-field>
    </v-layout>
  </v-form>
</template>

<script>
import draggable from 'vuedraggable';
import { alphaLower, getUniqueCharacters } from '_/CryptoTron/ciphers';
import mixin from './cipherKeysMixin';

export default {
  mixins: [mixin],
  components: {
    draggable,
  },
  data: () => ({
    plainAlphabet: [...alphaLower], // display as upper
    keyword: '',
    cipherAlphabet: [...alphaLower],
  }),
  computed: {
    key: {
      get() {
        const self = this;
        return {
          plainAlphabet: self.plainAlphabet,
          keyword: self.keyword,
          cipherAlphabet: self.cipherAlphabet,
        };
      },
      set(value) {
        // plainAlphabet should never change
        if (value.keyword !== undefined && value.keyword !== this.keyword) {
          this.keyword = value.keyword;
        }
        if (
          value.cipherAlphabet !== undefined
          && value.cipherAlphabet.join('') !== this.cipherAlphabet.join('')
        ) {
          this.cipherAlphabet.splice(
            0,
            this.cipherAlphabet.length,
            ...value.cipherAlphabet,
          );
        }
      },
    },
  },
  watch: {
    cipherAlphabet() {
      this.onInput();
    },
    keyword(newVal) {
      const word = newVal || '';
      this.cipherAlphabet.splice(
        0,
        this.cipherAlphabet.length,
        ...getUniqueCharacters(
          `${word.toLowerCase().replace(/[^a-z]/g, '')}${alphaLower}`,
        ),
      );
    },
  },
};
</script>
