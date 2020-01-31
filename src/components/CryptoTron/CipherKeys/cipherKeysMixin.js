export default {
  props: {
    value: {
      type: [Object, Boolean],
      required: false,
    },
  },
  computed: {
    currentValue() {
      return this.value;
    },
    key: {
      get() {
        return this.value;
      },
      set(newKey) {
        this.$emit('input', newKey);
      },
    },
  },
};
