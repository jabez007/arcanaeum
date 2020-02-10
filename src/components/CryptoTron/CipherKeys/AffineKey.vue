<template>
    <v-form ref="form">
      <v-layout row>
        <v-flex xs5>
          <v-text-field
            id="key-alpha"
            label="Alpha"
            type="number"
            v-model.number="key.alpha"
            :rules="[...rules, (val) => gcd(val, 26) === 1 || 'The value must be relatively prime to 26']"
            clearable
            required
          ></v-text-field>
        </v-flex>
        <v-spacer></v-spacer>
        <v-flex xs5>
          <v-text-field
            id="key-beta"
            label="Beta"
            type="number"
            v-model.number="key.beta"
            :rules="rules"
            clearable
            required
          ></v-text-field>
        </v-flex>
      </v-layout>
    </v-form>
</template>

<script>
import Rules from '_/rules';
import { gcd } from '_/CryptoTron/ciphers/affine';
import mixin from './cipherKeysMixin';

export default {
  mixins: [mixin],
  computed: {
    rules() {
      return [Rules.required, Rules.integer];
    },
  },
  methods: {
    gcd(a, b) {
      return gcd(a, b);
    },
  },
};
</script>
