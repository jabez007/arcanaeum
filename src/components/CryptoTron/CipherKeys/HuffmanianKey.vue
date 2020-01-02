<template>
  <v-form ref="form">
    <v-layout row wrap align-center>
      <v-flex lg7 class="hidden-md-and-down">
        <v-layout row wrap>
          <v-flex xs3 v-for="(char, key) in Object.keys(encoding)" :key="key">
            <v-text-field :label="char" v-model="encoding[char]" disabled readonly></v-text-field>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-spacer></v-spacer>
      <v-flex xs12 lg5>
        <v-textarea
          label="False Message"
          v-model.trim="falseMessage"
          :rules="rules"
          @input="onInput"
          rows="1"
          auto-grow
          clearable
          required
        ></v-textarea>
      </v-flex>
    </v-layout>
  </v-form>
</template>

<script>
import Rules from '_/rules';
import { encoding } from '_/CryptoTron/ciphers/huffmanian';
import mixin from './cipherKeysMixin';

export default {
  mixins: [mixin],
  data: () => ({
    falseMessage: '',
  }),
  computed: {
    encoding() {
      return encoding;
    },
    rules() {
      return [Rules.required];
    },
    key: {
      get() {
        const self = this;
        return {
          falseMessage: self.falseMessage,
        };
      },
      set(value) {
        if (
          value.falseMessage !== undefined
          && value.falseMessage !== this.falseMessage
        ) {
          this.falseMessage = value.falseMessage;
        }
      },
    },
  },
};
</script>
