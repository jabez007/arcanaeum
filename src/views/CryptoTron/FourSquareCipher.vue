<template>
  <Cipher :encryptAlgorithm="encrypt"
          :decryptAlgorithm="decrypt"
          :cipherKey="key">
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Four-Square Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
            Felix Delastelle (1840 - 1902) invented the four-square cipher,
            first published in a book in 1902.
            Delastelle was most famous for his invention of several systems of polygraphic substitution ciphers including bifid, trifid, and the four-square cipher.
        </p>
        <p>
            The technique encrypts pairs of letters (digraphs),
            and thus falls into a category of ciphers known as polygraphic substitution ciphers.
            This adds significant strength to the encryption when compared with monographic substitution ciphers which operate on single characters.
            The use of digraphs makes the four-square technique less susceptible to frequency analysis attacks,
            as the analysis must be done on 676 possible digraphs rather than just 26 for monographic substitution.
        </p>
        <p>
            The four-square cipher uses four 5 by 5 matrices arranged in a square.
            Each of the 5 by 5 matrices contains the letters of the alphabet (usually putting both "I" and "J" in the same location to reduce the alphabet to fit).
            In general, the upper-left and lower-right matrices are the "plaintext squares" and each contain a standard alphabet.
            The upper-right and lower-left squares are the "ciphertext squares" and contain a mixed alphabetic sequence.
        </p>
        <p>
            To generate the ciphertext squares,
            one would first fill in the spaces in the matrix with the letters of a keyword or phrase (dropping any duplicate letters),
            then fill the remaining spaces with the rest of the letters of the alphabet in order (again putting both "I" and "J" in the same location to reduce the alphabet to fit).
            The four-square algorithm allows for two separate keys, one for each of the two ciphertext matrices.
        </p>
        <p>
            To encrypt a message, one would follow these steps:
            <ul>
                <li>
                    Split the payload message into digraphs. (HELLO WORLD becomes HE LL OW OR LD)
                </li>
                <li>
                    Find the first letter in the digraph in the upper-left plaintext matrix.
                </li>
                <li>
                    Find the second letter in the digraph in the lower-right plaintext matrix.
                </li>
                <li>
                    The first letter of the encrypted digraph is in the same row as the first plaintext letter and the same column as the second plaintext letter.
                    It is therefore in the upper-right ciphertext matrix.
                </li>
                <li>
                    The second letter of the encrypted digraph is in the same row as the second plaintext letter and the same column as the first plaintext letter.
                    It is therefore in the lower-left ciphertext matrix.
                </li>
            </ul>
            As can be seen clearly,
            the method of encryption simply involves finding the other two corners of a rectangle defined by the two letters in the plaintext digraph.
            The encrypted digraph is simply the letters at the other two corners, with the upper-right letter coming first.
        </p>
        <p>
            Decryption works the same way, but in reverse.
            The ciphertext digraph is split with the first character going into the upper-right matrix and the second character going into the lower-left matrix.
            The other corners of the rectangle are then located. These represent the plaintext digraph with the upper-left matrix component coming first.
        </p>
      </v-card-text>
    </v-card>
    <four-square-key slot="key" v-model="key"></four-square-key>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import { encrypt, decrypt } from '_/CryptoTron/ciphers/fourSquare';
import { square } from '_/CryptoTron/ciphers/polybius';
import Cipher from '@/components/CryptoTron/Cipher.vue';
import FourSquareKey from '@/components/CryptoTron/CipherKeys/FourSquareKey.vue';

export default {
  components: {
    Cipher,
    FourSquareKey,
  },
  data: () => ({
    key: {
      plainSquare: square(''),
      keyword1: '',
      upperCipherSquare: square(''),
      keyword2: '',
      lowerCipherSquare: square(''),
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
