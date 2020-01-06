<template>
    <v-form ref="form">
        <v-layout row>
            <v-flex xs8></v-flex>
            <v-flex xs-4>
                <v-text-field
                  label="Keyword One"
                  v-model.trim="keyword1"
                  :rules="keywordRules"
                  @input="onInput"
                  required
                  clearable
                ></v-text-field>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs4></v-flex>
            <v-flex class="polybius-square" xs4>
                <polybius-square :square="plainSquare"></polybius-square>
            </v-flex>
            <v-flex class="polybius-square" xs4>
                <polybius-square :square="upperCipherSquare"></polybius-square>
            </v-flex>
        </v-layout>
        <v-layout row align-center>
            <v-flex xs4>
                <v-text-field
                  label="Keyword Two"
                  v-model.trim="keyword2"
                  :rules="keywordRules"
                  @input="onInput"
                  required
                  clearable
                ></v-text-field>
            </v-flex>
            <v-flex class="polybius-square" xs4>
                <polybius-square :square="lowerCipherSquare"></polybius-square>
            </v-flex>
            <v-flex class="polybius-square" xs4>
                <polybius-square :square="plainSquare"></polybius-square>
            </v-flex>
        </v-layout>
    </v-form>
</template>

<script>
import PolybiusSquare from '@/components/CryptoTron/PolybiusSquare.vue';
import Rules from '_/rules';
import { square } from '_/CryptoTron/ciphers/polybius';
import mixin from './cipherKeysMixin';

export default {
  mixins: [mixin],
  components: {
    PolybiusSquare,
  },
  data: () => ({
    keyword1: '',
    keyword2: '',
  }),
  computed: {
    keywordRules() {
      return [Rules.required, Rules.word];
    },
    plainSquare() {
      return square('');
    },
    upperCipherSquare() {
      return square(this.keyword1);
    },
    lowerCipherSquare() {
      return square(this.keyword2);
    },
    key: {
      get() {
        const self = this;
        return {
          plainSquare: self.plainSquare,
          keyword1: self.keyword1,
          upperCipherSquare: self.upperCipherSquare,
          keyword2: self.keyword2,
          lowerCipherSquare: self.lowerCipherSquare,
        };
      },
      set(value) {
        if (value.keyword1 !== undefined && value.keyword1 !== this.keyword1) {
          this.keyword1 = value.keyword1;
        }
        if (value.keyword2 !== undefined && value.keyword2 !== this.keyword2) {
          this.keyword2 = value.keyword2;
        }
      },
    },
  },
};
</script>

<style scoped>
.polybius-square {
    margin: 1rem;
}
</style>
