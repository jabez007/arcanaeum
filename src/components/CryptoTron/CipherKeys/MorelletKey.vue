<template>
  <v-form ref="form">
    <v-layout row wrap align-center>
      <v-spacer></v-spacer>
      <v-flex lg7 class="hidden-md-and-down">
        <v-layout row wrap>
          <v-flex xs1 v-for="(char, key) in Object.keys(encoding)" :key="key">
            <v-text-field :label="char" v-model="encoding[char]" disabled readonly></v-text-field>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex xs12 lg5>
        <v-layout row wrap>
            <v-flex xs6 lg4>
                <h6 class="title">Red [5]</h6>
                <material-picker v-model="red"/>
            </v-flex>
            <v-flex xs4>
                <h6 class="title">Orange [4]</h6>
                <material-picker v-model="orange"/>
            </v-flex>
            <v-flex xs4>
                <h6 class="title">Yellow [3]</h6>
                <material-picker v-model="yellow"/>
            </v-flex>
            <v-flex xs4>
                <h6 class="title">Green [2]</h6>
                <material-picker v-model="green"/>
            </v-flex>
            <v-flex xs4>
                <h6 class="title">Blue [1]</h6>
                <material-picker v-model="blue"/>
            </v-flex>
            <v-flex xs4>
                <h6 class="title">Purple [0]</h6>
                <material-picker v-model="purple"/>
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
  computed: {
    encoding() {
      return encoding;
    },
    rules() {
      return [Rules.required];
    },
    red: {
      get() {
        return this.key.colors[5];
      },
      set(value) {
        this.key.colors.splice(5, 1, typeof value === 'string' ? value : value.hex);
      },
    },
    orange: {
      get() {
        return this.key.colors[4];
      },
      set(value) {
        this.key.colors.splice(4, 1, typeof value === 'string' ? value : value.hex);
      },
    },
    yellow: {
      get() {
        return this.key.colors[3];
      },
      set(value) {
        this.key.colors.splice(3, 1, typeof value === 'string' ? value : value.hex);
      },
    },
    green: {
      get() {
        return this.key.colors[2];
      },
      set(value) {
        this.key.colors.splice(2, 1, typeof value === 'string' ? value : value.hex);
      },
    },
    blue: {
      get() {
        return this.key.colors[1];
      },
      set(value) {
        this.key.colors.splice(1, 1, typeof value === 'string' ? value : value.hex);
      },
    },
    purple: {
      get() {
        return this.key.colors[0];
      },
      set(value) {
        this.key.colors.splice(0, 1, typeof value === 'string' ? value : value.hex);
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
