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
      type: Object,
      required: false,
    },
  },
  data: () => ({
    alpha: undefined,
    beta: undefined,
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
        if (value.alpha !== this.alpha) {
          console.log('set alpha', value);
          this.alpha = value.alpha;
        }
        if (value.beta !== this.beta) {
          console.log('set beta', value);
          this.beta = value.beta;
        }
      },
    },
  },
  watch: {
    value(newVal) {
      console.log('watch', newVal, this.key);
      this.key = newVal;
    },
  },
  created() {
    if (this.value) {
      console.log('created', this.value);
      this.key = this.value;
    }
  },
  methods: {
    gcd(a, b) {
      return gcd(a, b);
    },
    onInput() {
      console.log('onInput');
      if (this.$refs.form.validate()) {
        this.$emit('input', this.key);
      }
    },
  },
};
</script>
