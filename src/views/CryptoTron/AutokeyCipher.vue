<template>
  <Cipher :encryptAlgorithm="encrypt" :decryptAlgorithm="decrypt" :cipherKey=" { primer }">
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Autokey Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The Autokey Cipher is a polyalphabetic substitution cipher.
          It is closely related to the Vigenere cipher, but uses a different method of generating the key.
          It was invented by Blaise de Vigenère in 1586, and is in general more secure than the Vigenere cipher.
        </p>
        <h6 class="title">Encryption</h6>
        <p>
          The 'key' for the Autokey cipher is a plaintext prepended with a word (the primer).
          That key is then used with the following table (the 'tabula recta') to encipher the plaintext:
          <TabulaRecta></TabulaRecta>To encrypt a message, place the key above the plaintext.
          Now we take a letter from the plaintext, and find it on the first column on the table.
          Then, we move along that row of the table until we come to the column with the corresponding letter from the key.
          The intersection is our ciphertext character.
        </p>
        <pre>
  Primer:     QUEENLY
  Plaintext:  ATTACK AT DAWN...
  Key:        QUEENL YA TTACK AT DAWN....
  Ciphertext: QNXEPV YT WTWP...
        </pre>
        <p>
          This can also be described through modular arithmetic.
          First, we convert all the letters of the plaintext and key to numbers ('a'=0, 'b'=1, ..., 'z'=25).
          Then we add each plaintext value to it's corresponding key value, modulo 26.
          <code>c = p + k (mod 26)</code>
          Finally, we convert those computed values back to letters.
        </p>
        <h6 class="title">Decryption</h6>
        <p>
          To decrypt the message, the recipient would start by writing down the agreed-on primer.
          Starting with the first letter of the primer, look across that row in the tabula recta until the first letter of the ciphertext is found.
          Append the letter at the top of the found column to the primer to begin reconstructing the key.
          Repeat this for each letter of the ciphertext, then the primer can be removed from the reconstructed key to reveal the plaintext
        </p>
        <p>
          In modular arithmetic, this is just subtracting the key value from the ciphertext value modulo 26.
          <code>p = c - k (mod 26)</code>
        </p>
      </v-card-text>
    </v-card>
    <v-form slot="key" ref="autokeyKeyForm" v-model="keyIsValid">
      <v-text-field
        label="Primer"
        v-model.trim="primer"
        :rules="rules"
        clearable
        required
      ></v-text-field>
    </v-form>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';
import TabulaRecta from '@/components/CryptoTron/TabulaRecta.vue';
// eslint-disable-next-line import/no-extraneous-dependencies
import Rules from '_/rules';

export default {
  components: {
    Cipher,
    TabulaRecta,
  },
  data: () => ({
    primer: '',
    keyIsValid: false,
  }),
  computed: {
    rules() {
      return [Rules.required, Rules.word];
    },
  },
  methods: {
    encrypt(plainText, cipherKey) {
      if (this.$refs.autokeyKeyForm.validate()) {
        const plaintext = (plainText || '')
          .toLowerCase()
          .replace(/[^a-z]/g, '');
        const key = (cipherKey.primer.toLowerCase() + plaintext).replace(
          /[^a-z]/g,
          '',
        );
        let ciphertext = '';
        for (let i = 0; i < plaintext.length; i += 1) {
          ciphertext += String.fromCharCode(
            ((plaintext.charCodeAt(i) - 97 + (key.charCodeAt(i) - 97)) % 26)
              + 97,
          );
        }
        return ciphertext;
      }
      return '';
    },
    decrypt(cipherText, cipherKey) {
      if (this.$refs.autokeyKeyForm.validate()) {
        const ciphertext = (cipherText || '')
          .toLowerCase()
          .replace(/[^a-z]/g, '');
        let key = cipherKey.primer.toLowerCase().replace(/[^a-z]/g, '');
        let plaintext = '';
        for (let i = 0; i < ciphertext.length; i += 1) {
          const plainchar = String.fromCharCode(
            ((ciphertext.charCodeAt(i) - 97 + 26 - (key.charCodeAt(i) - 97))
              % 26)
              + 97,
          );
          plaintext += plainchar;
          key += plainchar;
        }
        return plaintext;
      }
      return '';
    },
  },
};
</script>

<style scoped>
</style>
