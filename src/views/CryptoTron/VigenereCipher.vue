<template>
  <Cipher :encryptAlgorithm="encrypt" :decryptAlgorithm="decrypt" :cipherKey="key">
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Vigenère Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The Vigenère Cipher is a polyalphabetic substitution cipher.
          The method was originally described by Giovan Battista Bellaso in his 1553 book La cifra del. Sig. Giovan Battista Bellaso;
          however, the scheme was later misattributed to Blaise de Vigenère in the 19th century, and is now widely known as the Vigenère cipher.
        </p>
        <p>
          Blaise de Vigenère actually invented the stronger Autokey cipher in 1586.
        </p>
        <p>
          The Vigenère Cipher was considered le chiffre ind hiffrable (French for the unbreakable cipher) for 300 years,
          until in 1863 Friedrich Kasiski published a successful attack on the Vigenère cipher.
          Charles Babbage had, however, already developed the same test in 1854.
          Gilbert Vernam worked on the vigenere cipher in the early 1900s, and his work eventually led to the one-time pad,
          which is a provably unbreakable cipher.
        </p>
        <h6 class="title">Encryption</h6>
        <p>
          The Vigenère cipher uses a key word, e.g. 'FORTIFICATION',
          as its key with the <TabulaRecta></TabulaRecta> to encipher the plaintext.

          To encipher a message, repeat the keyword below the plaintext.
          Now we take the letter we will be encoding, and find it on the first column on the <TabulaRecta></TabulaRecta>.
          Then, we move along that row of the <TabulaRecta></TabulaRecta> until we come to the column with the key letter at the top,
          the intersection is our ciphertext character.
          <pre>
  Plaintext:  DEFEND THE EAST WALL OF THE CASTLE
  Key:        FORTIF ICA TION FORT IF ICA TIONFO
  Ciphertext: ISWXVI BJE XIGG BOCE WK BJE VIGGQS
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
  Key:        FORTIF ICA TION FORT IF ICA TIONFO
  Ciphertext: ISWXVI BJE XIGG BOCE WK BJE VIGGQS
  Plaintext:  DEFEND THE EAST WALL OF THE CASTLE
          </pre>
        </p>
        <p>
          In modular arithmetic this is just:
          <code>p = c - k (mod 26)</code>
        </p>
      </v-card-text>
    </v-card>
    <vigenere-key slot="key" v-model="key">
    </vigenere-key>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import { encrypt, decrypt } from '_/CryptoTron/ciphers/vigenere';
import Cipher from '@/components/CryptoTron/Cipher.vue';
import TabulaRecta from '@/components/CryptoTron/TabulaRecta.vue';
import VigenereKey from '@/components/CryptoTron/CipherKeys/VigenereKey.vue';

export default {
  components: {
    Cipher,
    TabulaRecta,
    VigenereKey,
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
