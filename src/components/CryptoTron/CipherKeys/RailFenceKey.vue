<template>
    <v-form ref="form">
      <v-text-field
        label="Number of Rails"
        type="number"
        v-model.number="rails"
        :rules="rules"
        @input="onInput"
        clearable
        required
      ></v-text-field>
    </v-form>
</template>

<script>
import Rules from '_/rules';

export default {
  props: {
    value: {
      type: [Object, Boolean],
      required: false,
    },
  },
  data: () => ({
    rails: 1,
  }),
  computed: {
    rules() {
      return [Rules.required, Rules.integer, Rules.positive];
    },
    key: {
      get() {
        const self = this;
        return {
          rails: self.rails,
        };
      },
      set(value) {
        if (value.rails !== undefined && value.rails !== this.rails) {
          this.rails = value.rails;
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
