<template>
  <Cipher :encryptAlgorithm="encrypt" :decryptAlgorithm="decrypt" :cipherKey="key">
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
          That key is then used with the <TabulaRecta></TabulaRecta> to encipher the plaintext.
          To encrypt a message, place the plaintext above the key.
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
          Then we add each plaintext value to its corresponding key value, modulo 26.
          <code>c = p + k (mod 26)</code>
          Finally, we convert those computed values back to letters.
        </p>
        <h6 class="title">Decryption</h6>
        <p>
          To decrypt the message, the recipient would start by writing down the agreed-on primer.
          Starting with the first letter of the primer, look across that row in the <TabulaRecta></TabulaRecta> until the first letter of the ciphertext is found.
          Append the letter at the top of the found column to the primer to begin reconstructing the key.
          Repeat this for each letter of the ciphertext, then the primer can be removed from the reconstructed key to reveal the plaintext
        </p>
        <p>
          In modular arithmetic, this is just subtracting the key value from the ciphertext value modulo 26.
          <code>p = c - k (mod 26)</code>
        </p>
      </v-card-text>
    </v-card>
    <autokey-key slot="key" v-model="key">
    </autokey-key>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import { encrypt, decrypt } from '_/CryptoTron/ciphers/autokey';
import Cipher from '@/components/CryptoTron/Cipher.vue';
import TabulaRecta from '@/components/CryptoTron/TabulaRecta.vue';
import AutokeyKey from '@/components/CryptoTron/CipherKeys/AutokeyKey.vue';

export default {
  components: {
    Cipher,
    TabulaRecta,
    AutokeyKey,
  },
  data: () => ({
    key: {
      primer: '',
    },
  }),
  methods: {
    encrypt(plainText, cipherKey) {
      return encrypt(cipherKey)(plainText);
    },
    decrypt(cipherText, cipherKey) {
      return decrypt(cipherKey)(cipherText);
    },
  },
};
</script>

<style scoped>
</style>
