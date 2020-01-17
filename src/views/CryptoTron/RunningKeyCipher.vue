<template>
  <Cipher :encryptAlgorithm="encrypt" :decryptAlgorithm="decrypt" :cipherKey="key">
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Running Key Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The Running Key cipher has the same internal workings as the Vigenere cipher.
          The difference lies in how the key is chosen; the Vigenere cipher uses a short key that repeats,
          whereas the running key cipher uses a long key such as an excerpt from a book.
          This means the key does not repeat, making cryptanalysis more difficult.
          The cipher can still be broken though, as there are statistical patterns in both the key and the plaintext which can be exploited.
        </p>
        <p>
          If the key for the running key cipher comes from a statistically random source, then it becomes a 'one time pad' cipher.
          One time pads are theoretically unbreakable ciphers, because every possible decryption is equally likely.
        </p>
        <h6 class="title">Encryption</h6>
        <p>
          The running key cipher uses a long piece of text, e.g. an excerpt from a book,
          as its key with the <TabulaRecta></TabulaRecta> to encipher the plaintext.

          To encipher a message, write the key stream below the plaintext.
          If we needed to encipher a longer plaintext, we could just continue reading from the key stream.
          Now we take the letter we will be encoding, and find it on the first column on the <TabulaRecta></TabulaRecta>.
          Then, we move along that row of the <TabulaRecta></TabulaRecta> until we come to the column with the key letter at the top,
          the intersection is our ciphertext character.
          <pre>
  Plaintext:  DEFEND THE EAST WALL OF THE CASTLE
  Key:        HOWDOE STH EDUC KKNO WT HAT SAIDVI
  Ciphertext: KSBHBH LAL IDMV GKYZ KY AHX UAAWGM
          </pre>
        </p>
        <p>
          This can also be described through modular arithmetic.
          First, we convert all the letters of the plaintext and key to numbers ('a'=0, 'b'=1, ..., 'z'=25).
          Then we add each plaintext value to its corresponding key value, modulo 26.
          <code>c = p + k (mod 26)</code>
          Finally, we convert those computed values back to letters.
        </p>
        <h6 class="title">Decryption</h6>
        <p>
          To decipher a message, we take the letter from our key, and find it on the first row on the <TabulaRecta></TabulaRecta>.
          Then, we move down that column of the <TabulaRecta></TabulaRecta> until we come to the ciphertext character,
          the character at the start of that row is our plaintext character.
          <pre>
  Key:        HOWDOE STH EDUC KKNO WT HAT SAIDVI
  Ciphertext: KSBHBH LAL IDMV GKYZ KY AHX UAAWGM
  Plaintext:  DEFEND THE EAST WALL OF THE CASTLE
          </pre>
        </p>
        <p>
          In modular arithmetic this is just:
          <code>p = c - k (mod 26)</code>
        </p>
      </v-card-text>
    </v-card>
    <running-key-key slot="key" v-model="key">
    </running-key-key>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import { encrypt, decrypt } from '_/CryptoTron/ciphers/runningKey';
import Cipher from '@/components/CryptoTron/Cipher.vue';
import TabulaRecta from '@/components/CryptoTron/TabulaRecta.vue';
import RunningKeyKey from '@/components/CryptoTron/CipherKeys/RunningKeyKey.vue';

export default {
  components: {
    Cipher,
    TabulaRecta,
    RunningKeyKey,
  },
  data: () => ({
    key: {
      keyText: '',
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
