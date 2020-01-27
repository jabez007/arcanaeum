<template>
  <v-form ref="form">
    <v-layout row wrap align-center>
      <v-spacer></v-spacer>
      <v-flex lg3 class="hidden-md-and-down">
        <v-layout row wrap>
          <v-flex xs3 v-for="(char, key) in Object.keys(encoding)" :key="key">
            <v-text-field :label="char" v-model="encoding[char]" disabled readonly></v-text-field>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex xs12 lg5>
        <v-layout row wrap>
            <v-flex xs6>
                <h6 class="title">Red [5]</h6>
                <material-picker v-model="red" @input="onInput"/>
            </v-flex>
            <v-flex xs6>
                <h6 class="title">Orange [4]</h6>
                <material-picker v-model="orange" @input="onInput"/>
            </v-flex>
            <v-flex xs6>
                <h6 class="title">Yellow [3]</h6>
                <material-picker v-model="yellow" @input="onInput"/>
            </v-flex>
            <v-flex xs6>
                <h6 class="title">Green [2]</h6>
                <material-picker v-model="green" @input="onInput"/>
            </v-flex>
            <v-flex xs6>
                <h6 class="title">Blue [1]</h6>
                <material-picker v-model="blue" @input="onInput"/>
            </v-flex>
            <v-flex xs6>
                <h6 class="title">Purple [0]</h6>
                <material-picker v-model="purple" @input="onInput"/>
            </v-flex>
        </v-layout>
      </v-flex>
      <v-spacer></v-spacer>
    </v-layout>
  </v-form>
</template>

<script>
import { Material } from 'vue-color';
import Rules from '_/rules';
import { encoding } from '_/CryptoTron/ciphers/morellet';
import mixin from './cipherKeysMixin';

export default {
  mixins: [mixin],
  components: {
    'material-picker': Material,
  },
  data: () => ({
    red: '#df2933',
    orange: '#ff5c30',
    yellow: '#ffd652',
    green: '#177b4b',
    blue: '#006597',
    purple: '#562b42',
  }),
  computed: {
    encoding() {
      return encoding;
    },
    rules() {
      return [Rules.required];
    },
    colors() {
      const self = this;
      return [
        typeof self.purple === 'string' ? self.purple : self.purple.hex,
        typeof self.blue === 'string' ? self.blue : self.blue.hex,
        typeof self.green === 'string' ? self.green : self.green.hex,
        typeof self.yellow === 'string' ? self.yellow : self.yellow.hex,
        typeof self.orange === 'string' ? self.orange : self.orange.hex,
        typeof self.red === 'string' ? self.red : self.red.hex,
      ];
    },
    key: {
      get() {
        const self = this;
        return {
          colors: self.colors,
        };
      },
      set(value) {
        if (
          value.colors !== undefined
          && value.colors.some((c, i) => c !== this.colors[i])
        ) {
          const self = this;
          [
            self.purple,
            self.blue,
            self.green,
            self.yellow,
            self.orange,
            self.red,
          ] = value.colors;
        }
      },
    },
  },
};
</script>

<style scoped>
.vc-material {
    box-shadow: unset;
    height: unset;
    width: unset;
}
</style>
