<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="{ rails }"
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
          For example, if we have
          <a @click="rails=3">3 rails</a>
          and a message of
          <q>WE ARE DISCOVERED. FLEE AT ONCE</q>
          then the cipher text reads off as
          <q>WECRLTEERDSOEEFEAOCAIVDEN</q>
        </p>
        <v-scale-transition>
          <v-card v-if="rails >= 3 && rails <= 5">
            <v-card-text>
              <v-text-field v-model="exampleMsg"></v-text-field>
              <table>
                <tr v-for="i in cipherGrid.length" :key="i">
                  <td v-for="j in cipherGrid[i-1].length" :key="j">{{ cipherGrid[i-1][j-1] }}</td>
                </tr>
              </table>
              <br/>
              <p class="body-2">
                {{ cipherGrid.flat().map(c => c.replace(/[^a-z]/, '')).join('') }}
              </p>
            </v-card-text>
          </v-card>
        </v-scale-transition>
      </v-card-text>
    </v-card>
    <v-form slot="key" ref="railFenceKeyForm" v-model="keyIsValid">
      <v-text-field
        label="Number of Rails"
        v-model.number="rails"
        type="number"
        :rules="[rules.required, rules.number, rules.positive]"
        clearable
        required
      ></v-text-field>
    </v-form>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';

function cycleLength(rails) {
  return Math.max(0, 2 * rails - 2); // 0 is our min cycle length
}

export default {
  components: {
    Cipher,
  },
  data: () => ({
    rails: 1,
    rules: {
      required: value => !!value || 'A key is required',
      number: value => (!!value && Number.isInteger(Number(value)))
        || 'The key must be an integer',
      positive: value => (!!value && value > 0) || 'The key must be positive',
    },
    keyIsValid: true,
    exampleMsg: '',
  }),
  computed: {
    cipherGrid() {
      if (this.rails >= 3 && this.rails <= 5) {
        const msg = this.exampleMsg.toLowerCase().replace(/[^a-z]/g, '');
        const grid = new Array(this.rails)
          .fill('-')
          .map(() => new Array(msg.length).fill('-'));
        let column = 0; // each character has it's own column
        let row = 0;
        while (column < grid[row].length) {
          while (row < this.rails - 1) {
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
      if (this.$refs.railFenceKeyForm.validate() && plainText) {
        const plaintext = plainText.toLowerCase().replace(/[^a-z]/g, '');
        if (cipherKey.rails === 1) {
          return plaintext;
        }
        let ciphertext = '';
        for (let i = 0; i < cipherKey.rails; i += 1) {
          // write down/up the columns
          const downCycle = cycleLength(cipherKey.rails - i);
          const upCycle = cycleLength(i + 1);
          // read along the rows
          let j = i;
          if (j < plaintext.length) {
            ciphertext += plaintext[j];
          }
          while (j < plaintext.length) {
            if (downCycle) {
              j += downCycle;
              if (j < plaintext.length) {
                ciphertext += plaintext[j];
              }
            }
            if (upCycle) {
              j += upCycle;
              if (j < plaintext.length) {
                ciphertext += plaintext[j];
              }
            }
          }
        }
        return ciphertext;
      }
      return '';
    },
    decrypt(cipherText, cipherKey) {
      if (this.$refs.railFenceKeyForm.validate() && cipherText) {
        const ciphertext = cipherText.toLowerCase().replace(/[^a-z]/g, '');
        if (cipherKey.rails === 1) {
          return ciphertext;
        }
        const plaintext = new Array(ciphertext.length);
        let k = 0;
        for (let i = 0; i < cipherKey.rails; i += 1) {
          // read down/up the columns
          const downCycle = cycleLength(cipherKey.rails - i);
          const upCycle = cycleLength(i + 1);
          // write along the rows
          let j = i;
          plaintext[j] = ciphertext[k];
          k += 1;
          while (j < ciphertext.length) {
            if (downCycle) {
              j += downCycle;
              if (j < ciphertext.length) {
                plaintext[j] = ciphertext[k];
                k += 1;
              }
            }
            if (upCycle) {
              j += upCycle;
              if (j < ciphertext.length) {
                plaintext[j] = ciphertext[k];
                k += 1;
              }
            }
          }
        }
        const ptext = plaintext.join('');
        return ptext;
      }
      return '';
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
      this.rails = newKey.rails;
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
  color: orange;
  text-align: center;
}
</style>
