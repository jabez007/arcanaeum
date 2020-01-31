<template>
    <v-form ref="form">
        <v-layout row>
            <v-flex xs8></v-flex>
            <v-flex xs-4>
                <v-text-field
                  label="Keyword One"
                  v-model.trim="compKeyword1"
                  :rules="keywordRules"
                  required
                  clearable
                ></v-text-field>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs4></v-flex>
            <v-flex class="polybius-square" xs4>
                <polybius-square :square="key.plainSquare"></polybius-square>
            </v-flex>
            <v-flex class="polybius-square" xs4>
                <polybius-square :square="upperCipherSquare"></polybius-square>
            </v-flex>
        </v-layout>
        <v-layout row align-center>
            <v-flex xs4>
                <v-text-field
                  label="Keyword Two"
                  v-model.trim="compKeyword2"
                  :rules="keywordRules"
                  required
                  clearable
                ></v-text-field>
            </v-flex>
            <v-flex class="polybius-square" xs4>
                <polybius-square :square="lowerCipherSquare"></polybius-square>
            </v-flex>
            <v-flex class="polybius-square" xs4>
                <polybius-square :square="key.plainSquare"></polybius-square>
            </v-flex>
        </v-layout>
    </v-form>
</template>

<script>
import Rules from '_/rules';
import { square } from '_/CryptoTron/ciphers/polybius';
import PolybiusSquare from '@/components/CryptoTron/PolybiusSquare.vue';
import mixin from './cipherKeysMixin';

export default {
  mixins: [mixin],
  components: {
    PolybiusSquare,
  },
  computed: {
    keywordRules() {
      return [Rules.required, Rules.word];
    },
    compKeyword1: {
      get() {
        return this.key.keyword1;
      },
      set(value) {
        this.key.keyword1 = value;
        this.upperCipherSquare = value;
      },
    },
    upperCipherSquare: {
      get() {
        return this.key.upperCipherSquare;
      },
      set(value) {
        this.key.upperCipherSquare = square(value);
      },
    },
    compKeyword2: {
      get() {
        return this.key.keyword2;
      },
      set(value) {
        this.key.keyword2 = value;
        this.lowerCipherSquare = value;
      },
    },
    lowerCipherSquare: {
      get() {
        return this.key.lowerCipherSquare;
      },
      set(value) {
        this.key.lowerCipherSquare = square(value);
      },
    },
  },
  created() {
    this.key.plainSquare = square('');
  },
};
</script>

<style scoped>
.polybius-square {
    margin: 1rem;
}
</style>
