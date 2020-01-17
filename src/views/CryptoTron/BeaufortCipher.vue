<template>
  <Cipher :encryptAlgorithm="encrypt" :decryptAlgorithm="decrypt" :cipherKey="key">
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Beaufort Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The Beaufort cipher, created by Sir Francis Beaufort,
          is a polyalphabetic substitution cipher that is similar to the Vigenère cipher,
          except that it enciphers characters in a slightly different manner.
        </p>
        <h6 class="title">Encryption</h6>
        <p>
          The beaufort cipher uses a key word, e.g. 'FORTIFICATION',
          as its key with the <TabulaRecta></TabulaRecta> to encipher the plaintext.

          To encipher a message, repeat the keyword below the plaintext.
          Now we take the letter we will be encoding, and find the column on the <TabulaRecta></TabulaRecta>,
          Then, we move down that column of the <TabulaRecta></TabulaRecta> until we come to the key letter.
          Our ciphertext character is then read from the far left of the row our key character was in.
          <pre>
  Plaintext:  DEFEND THE EAST WALL OF THE CASTLE
  Key:        FORTIF ICA TION FORT IF ICA TIONFO
  Ciphertext: CKMPVC PVW PIWU JOGI UA PVW RIWUUK
          </pre>
        </p>
        <p>
          This can also be described through modular arithmetic.
          First, we convert all the letters of the plaintext and key to numbers ('a'=0, 'b'=1, ..., 'z'=25).
          Then we subtract each plaintext value from its corresponding key value, modulo 26.
          <code>c = k - p (mod 26)</code>
          Finally, we convert those computed values back to letters.
        </p>
        <h6 class="title">Decryption</h6>
        <p>
          Deciphering is performed in an identical fashion, i.e. encryption and decryption using the beaufort cipher uses exactly the same algorithm.
          <pre>
  Ciphertext: CKMPVC PVW PIWU JOGI UA PVW RIWUUK
  Key:        FORTIF ICA TION FORT IF ICA TIONFO
  Plaintext:  DEFEND THE EAST WALL OF THE CASTLE
          </pre>
        </p>
        <p>
          From the modular arithmetic forumula used for encryption,
          it becomes a bit more obvious that the decryption algorithm is the same:
          <code>p = k - c (mod 26)</code>
        </p>
      </v-card-text>
    </v-card>
    <beaufort-key slot="key" v-model="key">
    </beaufort-key>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import { encrypt, decrypt } from '_/CryptoTron/ciphers/beaufort';
import Cipher from '@/components/CryptoTron/Cipher.vue';
import TabulaRecta from '@/components/CryptoTron/TabulaRecta.vue';
import BeaufortKey from '@/components/CryptoTron/CipherKeys/BeaufortKey.vue';

export default {
  components: {
    Cipher,
    TabulaRecta,
    BeaufortKey,
  },
  data: () => ({
    key: {
      keyword: '',
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
