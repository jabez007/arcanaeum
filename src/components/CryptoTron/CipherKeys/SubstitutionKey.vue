<template>
  <v-form ref="form">
    <v-layout row>
      <div>
        <v-chip
          v-for="char in key.plainAlphabet"
          :key="char.toUpperCase()"
          style="margin: 1px !important; font-family: monospace, monospace;"
          label
          small
        >{{ char.toUpperCase() }}</v-chip>
      </div>
    </v-layout>
    <v-layout row>
      <draggable v-model="key.cipherAlphabet" group="key.cipherAlphabet">
        <transition-group>
          <v-chip
            v-for="char in key.cipherAlphabet"
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
      <v-text-field label="Key Word" v-model.trim="compKeyword" clearable></v-text-field>
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
  computed: {
    compKeyword: {
      get() {
        return this.key.keyword;
      },
      set(value) {
        this.key.keyword = value;
      },
    },
  },
  watch: {
    compKeyword(newVal) {
      this.key.cipherAlphabet.splice(
        0,
        this.key.cipherAlphabet.length,
        ...getUniqueCharacters(
          `${(newVal || '').toLowerCase().replace(/[^a-z]/g, '')}${alphaLower}`,
        ),
      );
    },
  },
  created() {
    this.key.plainAlphabet = [...alphaLower]; // display as upper
    this.key.cipherAlphabet = [...alphaLower];
  },
};
</script>
