<template>
  <v-card>
    <v-slide-y-transition hide-on-leave>
      <v-progress-circular v-show="crackingMessage"
                           :size="clientHeight"
                           style="width:100%;"
                           indeterminate>
      </v-progress-circular>
    </v-slide-y-transition>
    <v-slide-y-reverse-transition hide-on-leave>
      <v-card-text ref="client"
                   v-show="!crackingMessage">
        <v-layout row
                  wrap>
          <v-flex xs12
                  md9>
            <v-textarea label="Cipher Text"
                        v-model="cipherText"
                        append-icon="send"
                        @click:append="crackMessage"
                        auto-grow
                        clearable>
            </v-textarea>
          </v-flex>
          <v-spacer></v-spacer>
          <v-flex xs12
                  md2>
            <v-text-field label="Max key attempts"
                          v-model.number="maxSteps"
                          type="number"
                          persistent-hint
                          clearable
                          required>
            </v-text-field>
          </v-flex>
        </v-layout>
        <v-textarea label="Plain Text"
                    :value="plainText"
                    prepend-inner-icon="file_copy"
                    @click:prepend-inner="copyToClipboard"
                    append-icon="save"
                    @click:append="save"
                    outline
                    auto-grow
                    readonly>
        </v-textarea>
      </v-card-text>
    </v-slide-y-reverse-transition>
  </v-card>
</template>

<script>
import axios from 'axios';
import FileSaver from 'file-saver';
import lzString from 'lz-string/libs/lz-string';

export default {
  name: 'CrackMessage',
  props: {
    decryptAlgorithm: {
      type: Function,
      required: true,
    },
    keysGenerator: {
      type: Function,
      required: true,
    },
    ngramsFile: {
      type: String,
      default: 'quadgrams',
    },
  },
  data: () => ({
    ngrams: null,
    cipherText: '',
    plainText: '',
    maxSteps: 1000,
    crackingMessage: false,
    clientHeight: 0,
  }),
  computed: {
    L() {
      if (this.ngrams) {
        return parseInt(localStorage.getItem(`${this.ngramsFile}L`), 10);
      }
      return 0;
    },
    N() {
      if (this.ngrams) {
        return parseInt(localStorage.getItem(`${this.ngramsFile}N`), 10);
      }
      return 0;
    },
    floor() {
      if (this.ngrams) {
        return parseFloat(localStorage.getItem(`${this.ngramsFile}floor`));
      }
      return 0.0;
    },
  },
  created() {
    const storedNgrams = localStorage.getItem(this.ngramsFile);
    if (storedNgrams) {
      this.ngrams = JSON.parse(lzString.decompress(storedNgrams));
    } else {
      const self = this;
      axios.get(`/ngrams/${this.ngramsFile}.json`)
        .then((response) => {
          const ngramsObj = response.data;

          localStorage.setItem(self.ngramsFile, lzString.compress(JSON.stringify(ngramsObj)));

          localStorage.setItem(`${self.ngramsFile}L`, Object.keys(ngramsObj)[0].length);

          const sum = Object.values(ngramsObj).reduce((a, b) => a + b, 0);
          localStorage.setItem(`${self.ngramsFile}N`, sum);
          localStorage.setItem(`${self.ngramsFile}floor`, Math.log10(0.01 / sum));

          self.ngrams = ngramsObj;
          alert('ready');
        })
        .catch((err) => {
          alert(err);
        });
    }
  },
  methods: {
    getLogProb(ngram) {
      return Math.log10(this.ngrams[ngram] / this.N);
    },
    getScore(text) {
      const textUpper = text.toUpperCase();
      let score = 0;
      for (let i = 0; i <= textUpper.length - this.L; i += 1) {
        if (textUpper.slice(i, i + this.L) in this.ngrams) {
          score += this.getLogProb(textUpper.slice(i, i + this.L));
        } else {
          score += this.floor;
        }
      }
      return score;
    },
    crackMessage() {
      this.clientHeight = this.$refs.client.clientHeight;
      this.crackingMessage = true;
      const self = this;
      setTimeout(() => {
        const ciphertext = self.cipherText;
        let bestScore = Number.MIN_SAFE_INTEGER;
        let bestKey = null;
        let s = 0;
        let key = null;
        // eslint-disable-next-line
        while (key = self.keysGenerator(key, ciphertext, bestKey)) {
          const plaintext = self.decryptAlgorithm(ciphertext, key).toUpperCase().replace(/[^A-Z]/g, '');
          const currentScore = self.getScore(plaintext);
          if (currentScore > bestScore) {
            bestScore = currentScore;
            bestKey = key;
            self.plainText = plaintext;
            s = 0;
          }
          if (s > self.maxSteps) {
            break;
          } else {
            s += 1;
          }
        }
        self.$emit('update-key', bestKey);
        self.crackingMessage = false;
      }, 100);
    },
    copyToClipboard() {
      const self = this;
      this.$copyText(this.plainText)
        .then(() => {
          self.$emit('success', 'copied!');
        })
        .catch((err) => {
          self.$emit('error', err.message);
        });
    },
    save() {
      const blob = new Blob([this.plainText], {
        type: 'text/plain;charset=utf-8',
      });
      FileSaver.saveAs(blob, 'Plain.txt');
    },
  },
};
</script>

<style scoped>
</style>
