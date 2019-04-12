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
            <v-text-field label="Max Steps"
                          v-model.number="maxSteps"
                          type="number"
                          hint="maximum number of keys to attempt after finding a 'best key'"
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
                    outline
                    auto-grow
                    readonly>
        </v-textarea>
      </v-card-text>
    </v-slide-y-reverse-transition>
  </v-card>
</template>

<script>
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
    cipherText: '',
    plainText: '',
    maxSteps: 1000,
    crackingMessage: false,
    clientHeight: 0,
    ngrams: null,
    L: 0,
    N: 0,
    floor: 0.0,
  }),
  methods: {
    getLogProb(ngram) {
      return Math.log10(this.ngrams[ngram] / this.N);
    },
    getScore(text) {
      const textUpper = text.toUpperCase();
      let score = 0;
      for (let i = 0; i <= textUpper.length - this.L; i++) {
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
        if (!self.ngrams) {
          this.ngrams = require(`../../assets/CryptoTron/${self.ngramsFile}.json`);
          let sum = 0;
          for (const name in self.ngrams) {
            if (Number.isInteger(self.ngrams[name])) {
              self.L = name.length;
              sum += self.ngrams[name];
            }
          }
          self.N = sum;
          self.floor = Math.log10(0.01 / sum);
        }
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
  },
};
</script>

<style scoped>
</style>
