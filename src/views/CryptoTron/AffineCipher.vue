<template>
  <Cipher :encryptAlgorithm="encrypt"
          :decryptAlgorithm="decrypt"
          :cipherKey="{alpha, beta}"
          :keysGenerator="possibleKeys"
          @update-key="onUpdateKey">
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Affine Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The Affine cipher is a special case of the more general monoalphabetic substitution cipher.
          The cipher is less secure than a substitution cipher as it is vulnerable to all of the attacks that work against substitution ciphers,
          in addition to other attacks.
          The cipher's primary weakness comes from the fact that if the cryptanalyst can discover
          (by means of frequency analysis, brute force, guessing or otherwise)
          the plaintext of two ciphertext characters,
          then the key can be obtained by solving a simultaneous equation.
        </p>
        <p>
          The 'key' for the Affine cipher consists of 2 numbers, we'll call them alpha and beta.
          The following discussion assumes the use of a 26 character alphabet (m = 26).
          Alpha should be chosen to be relatively prime to m (i.e. alpha should have no factors in common with m).
          For example 15 and 26 have no factors in common, so 15 is an acceptable value for alpha,
          however 12 and 26 have factors in common (e.g. 2) so 12 cannot be used for a value of alpha.
          When encrypting, we first convert all the letters to numbers ('a'=0, 'b'=1, ..., 'z'=25).
          The ciphertext letter c, for any given letter p is (remember p is the number representing a letter):
          <code>c = alpha * p + beta (mod m)</code>
          <br />
          The decryption function then is:
          <code>p = alpha^-1 * (c - beta) (mod m)</code>
          where alpha^-1 is the multiplicative inverse of alpha in the group of integers modulo m.
          To find the multiplicative inverse of alpha, we need to find a number x such that:
          <code>alpha * x = 1 (mod m)</code>.
          The easiest way to solve this equation (in our small case) is to search each of the numbers 1 to 25, and see which one satisfies the equation.
        </p>
        <p>
          The <a @click="alpha=25; beta=25">Atbash</a> cipher is also an Affine cipher with alpaha=25 and beta=25.
        </p>
      </v-card-text>
    </v-card>
    <v-form slot="key"
            ref="affineKeyForm"
            v-model="keyIsValid">
      <v-layout row wrap>
        <v-flex xs5>
          <v-text-field label="Alpha"
                        type="number"
                        v-model.number="alpha"
                        :rules="[rules.required, rules.number, () => gcd(alpha, 26) === 1 || 'The value must be relatively prime to 26']"
                        clearable
                        required>
          </v-text-field>
        </v-flex>
        <v-spacer></v-spacer>
        <v-flex xs5>
          <v-text-field label="Beta"
                        type="number"
                        v-model.number="beta"
                        :rules="[rules.required, rules.number]"
                        clearable
                        required>
          </v-text-field>
        </v-flex>
      </v-layout>
     </v-form>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';

export default {
  components: {
    Cipher,
  },
  data: () => ({
    alpha: 1,
    beta: 0,
    rules: {
      required: value => (!!value || value === 0) || 'A value is required',
      number: value => Number.isInteger(Number(value)) || 'The value must be an integer',
    },
    keyIsValid: true,
  }),
  methods: {
    gcd(a, b) {
      if (!b) {
        return a;
      }
      return this.gcd(b, a % b);
    },
    encrypt(plainText, key) {
      if (this.$refs.affineKeyForm.validate() && plainText) {
        const plaintext = plainText.toLowerCase();
        let ciphertext = '';
        const re = /[a-z]/;
        for (let i = 0; i < plaintext.length; i += 1) {
          if (re.test(plaintext.charAt(i))) {
            ciphertext += String.fromCharCode((key.alpha * (plaintext.charCodeAt(i) - 97) + key.beta) % 26 + 97);
          } else {
            ciphertext += plaintext.charAt(i);
          }
        }
        return ciphertext;
      }
      return '';
    },
    findInverse(a) {
      for (let i = 1; i < 26; i += 1) {
        if (((a * i) % 26) === 1) {
          return i;
        }
      }
      return NaN;
    },
    decrypt(cipherText, key) {
      if (this.$refs.affineKeyForm.validate() && cipherText) {
        const inverse = this.findInverse(key.alpha);
        const ciphertext = cipherText.toLowerCase();
        let plaintext = '';
        const re = /[a-z]/;
        for (let i = 0; i < ciphertext.length; i += 1) {
          if (re.test(ciphertext.charAt(i))) {
            plaintext += String.fromCharCode(inverse * (ciphertext.charCodeAt(i) - 97 + 26 - key.beta) % 26 + 97);
          } else {
            plaintext += ciphertext.charAt(i);
          }
        }
        return plaintext;
      }
      return '';
    },
    possibleKeys(key) {
      if (!key) {  // first pass is '' 
        return { alpha: 1, beta: 0 };
      }
      let alpha = key.alpha;
      let beta = key.beta;
      if (alpha >= 25 && beta >= 25)
      {
        return;
      }
      if (alpha < 25 && beta === 25)
      {
        // restart beta and roll alpha up
        beta = 0; 
        alpha = (alpha + 1) % 26;
        while (this.gcd(alpha, 26) !== 1) {
          alpha += 1;
        }
      } else {
        // just increment beta
        beta = (beta + 1) % 26;
      }
      return { alpha, beta };
    },
    onUpdateKey(newKey) {
      this.alpha = newKey.alpha;
      this.beta = newKey.beta;
    }
  },
};
</script>

<style scoped>
</style>