<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="key"
    :keysGenerator="possibleKeys"
    @update-key="onUpdateKey"
  >
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Rail-Fence Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The rail-fence cipher (also called a zigzag cipher) is a very simple form of transposition cipher.
          It derives its name from the way in which it is encoded,
          following a simple rule for mixing up the characters in the plaintext to form the ciphertext.
        </p>
        <p>
          The rail-fence cipher is often decribed as a "write down the columns, read along the rows" cipher.
          This is equivalent to using an un-keyed columnar transposition cipher.
        </p>
        <p>
          The rail-fence cipher offers essentially no communication security, and can be easily broken even by hand.
          Although weak on its own, it can be combined with other ciphers, such as a
          <a
            @click="$router.push('/cryptotron/substitution')"
          >substitution cipher</a>,
          the combination of which is more difficult to break than either cipher on it's own.
        </p>
        <h6 class="title">Example</h6>
        <p>
          The key for the railfence cipher is just the number of rails.
          To encrypt a piece of text, the plain text is written downwards and diagonally on successive "rails" of an imaginary fence,
          then moving up when we reach the bottom rail.
          When we reach the top rail, the message is written downwards again.
          This continues until the whole plaintext is written out.
          The message is then read off in rows.
        </p>
        <p>
          For <a @click="key={ rails: 3 }; exampleMsg='WE ARE DISCOVERED. FLEE AT ONCE'">example</a>,
          if we have 3 rails and a message of
          <q>WE ARE DISCOVERED. FLEE AT ONCE</q>
          then the cipher text reads off as
          <q>WECRLTEERDSOEEFEAOCAIVDEN</q>
        </p>
        <v-expand-transition>
          <v-card v-if="key.rails >= 3 && key.rails <= 5 && exampleMsg">
            <v-card-title>
              <v-text-field v-model="exampleMsg"></v-text-field>
              <v-icon @click="exampleMsg=''">close</v-icon>
            </v-card-title>
            <v-card-text>
              <table>
                <tr v-for="i in cipherGrid.length" :key="i">
                  <td
                    v-for="j in cipherGrid[i-1].length" :key="j"
                    :class="`amber--text ${cipherGrid[i-1][j-1] === '-' ? 'text--lighten-3' : 'text--darken-3'}`"
                  >{{ cipherGrid[i-1][j-1] }}</td>
                </tr>
              </table>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <span class="body-2 amber--text">
                {{ cipherGrid.flat().map(c => c.replace(/[^a-z]/, '')).join('') }}
              </span>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-expand-transition>
      </v-card-text>
    </v-card>
    <rail-fence-key slot="key" v-model="key"></rail-fence-key>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';
import RailFenceKey from '@/components/CryptoTron/CipherKeys/RailFenceKey.vue';
import { encrypt, decrypt } from '_/CryptoTron/ciphers/railFence';

export default {
  components: {
    Cipher,
    RailFenceKey,
  },
  data: () => ({
    key: {
      rails: 1,
    },
    exampleMsg: '',
  }),
  computed: {
    cipherGrid() {
      const { rails } = this.key;
      if (rails >= 3 && rails <= 5 && this.exampleMsg) {
        const msg = this.exampleMsg.toLowerCase().replace(/[^a-z]/g, '');
        const grid = new Array(rails)
          .fill('-')
          .map(() => new Array(msg.length).fill('-'));
        let column = 0; // each character has it's own column
        let row = 0;
        while (column < grid[row].length) {
          while (row < rails - 1) {
            if (msg.charAt(column)) {
              grid[row].splice(column, 1, msg.charAt(column));
            } else {
              grid[row].splice(column, 1, '-');
            }
            column += 1;
            row += 1;
            if (column >= grid[row].length) {
              break;
            }
          }
          if (column >= grid[row].length) {
            break;
          }
          while (row > 0) {
            if (msg.charAt(column)) {
              grid[row].splice(column, 1, msg.charAt(column));
            } else {
              grid[row].splice(column, 1, '-');
            }
            column += 1;
            row -= 1;
            if (column >= grid[row].length) {
              break;
            }
          }
        }
        return grid;
      }
      return [[]];
    },
  },
  methods: {
    encrypt(plainText, cipherKey) {
      return encrypt(cipherKey)(plainText);
    },
    decrypt(cipherText, cipherKey) {
      return decrypt(cipherKey)(cipherText);
    },
    possibleKeys(key, ciphertext) {
      if (!key) {
        // first pass is ''
        return { rails: 1 };
      }
      if (key.rails >= ciphertext.length) {
        return null;
      }
      return { rails: key.rails + 1 };
    },
    onUpdateKey(newKey) {
      this.key = newKey;
    },
  },
};
</script>

<style scoped>
table {
  width: 100%;
  border-spacing: 1px;
  border-collapse: separate;
  font-family: monospace, monospace;
}
tr {
  background: var(--v-secondary-base);
}
tr:nth-child(odd) {
  background: var(--v-secondary-lighten1);
}
tr:nth-child(even) {
  background: var(--v-secondary-darken1);
}
td {
  text-align: center;
}
</style>
