export default {
  props: {
    value: {
      type: [Object, Boolean],
      required: false,
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
