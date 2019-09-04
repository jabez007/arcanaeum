<template>
  <svg
    class="strike"
    :height="height"
    :width="width"
    :style="`stroke-dasharray: ${strikeLength}; stroke-dashoffset: ${strikeLength};`"
  >
    <line
      :x1="x1"
      :y1="y1"
      :x2="x2"
      :y2="y2"
      :style="`stroke: ${color}; stroke-width: ${strikeWidth};`"
    />
  </svg>
</template>

<script>
export default {
  name: 'staff-strike',
  props: {
    height: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    direction: {
      type: Number,
      required: true,
    },
    strikeWidth: {
      type: Number,
      default: 5,
    },
  },
  computed: {
    strikeLength() {
      return ((this.width ** 2) + (this.height ** 2)) ** (1 / 2);
    },
    x1() {
      switch (this.direction) {
        case 1:
        case 3:
        case 7:
          return this.width;
        case 2:
        case 4:
        case 8:
          return 0;
        case 5:
        case 6:
          return this.width / 2;
        default:
          return null;
      }
    },
    y1() {
      switch (this.direction) {
        case 1:
        case 3:
        case 5:
          return 0;
        case 2:
        case 4:
        case 6:
          return this.height;
        case 7:
        case 8:
          return this.height / 2;
        default:
          return null;
      }
    },
    x2() {
      switch (this.direction) {
        case 1:
        case 3:
        case 7:
          return 0;
        case 2:
        case 4:
        case 8:
          return this.width;
        case 5:
        case 6:
          return this.width / 2;
        default:
          return null;
      }
    },
    y2() {
      switch (this.direction) {
        case 1:
        case 3:
        case 5:
          return this.height;
        case 2:
        case 4:
        case 6:
          return 0;
        case 7:
        case 8:
          return this.height / 2;
        default:
          return null;
      }
    },
  },
};
</script>

<style scoped>
.strike {
  animation-name: strike;
  /*animation-delay: 0.25s;*/
  animation-duration: 0.5s;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes strike {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
