<template>
    <v-form ref="form">
      <v-layout row>
        <v-flex xs5>
          <v-text-field
            label="Alpha"
            type="number"
            v-model.number="alpha"
            :rules="[...rules, (val) => gcd(val, 26) === 1 || 'The value must be relatively prime to 26']"
            @input="onInput"
            clearable
            required
          ></v-text-field>
        </v-flex>
        <v-spacer></v-spacer>
        <v-flex xs5>
          <v-text-field
            label="Beta"
            type="number"
            v-model.number="beta"
            :rules="rules"
            @input="onInput"
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

export default {
  props: {
    value: {
      type: [Object, Boolean],
      required: false,
    },
  },
  data: () => ({
    alpha: 1,
    beta: 0,
  }),
  computed: {
    rules() {
      return [Rules.required, Rules.integer];
    },
    key: {
      get() {
        const self = this;
        return {
          alpha: self.alpha,
          beta: self.beta,
        };
      },
      set(value) {
        if (value.alpha !== undefined && value.alpha !== this.alpha) {
          this.alpha = value.alpha;
        }
        if (value.beta !== undefined && value.beta !== this.beta) {
          this.beta = value.beta;
        }
      },
    },
  },
  watch: {
    value(newVal) {
      this.key = newVal;
    },
  },
  created() {
    if (this.value) {
      this.key = this.value;
    }
  },
  methods: {
    gcd(a, b) {
      return gcd(a, b);
    },
    onInput() {
      if (this.$refs.form.validate()) {
        this.$emit('input', this.key);
      } else {
        this.$emit('input', false);
      }
    },
  },
};
</script>
