<template>
  <table>
    <thead v-if="cipherChars">
      <tr>
        <td></td>
        <td v-for="c in cipherChars" :key="c" style="color:red;">{{ c }}</td>
      </tr>
    </thead>
    <tr v-for="(row, r) in square" :key="r">
      <td style="color:red;" v-if="cipherChars">{{ (cipherChars || '').charAt(r) }}</td>
      <td v-for="c in row" :key="c">{{ c }}</td>
    </tr>
  </table>
</template>

<script>
export default {
  props: {
    square: {
      type: Array,
      requred: true,
    },
    cipherChars: {
      type: String,
      required: false,
    },
  },
};
</script>

<style scoped>
table {
  width: 100%;
  border-spacing: 0px;
  font-family: monospace, monospace;
}
tr {
  background: var(--v-secondary-base);
}
tr:nth-child(odd) {
  background: var(--v-secondary-lighten1);
}
tr:nth-child(even) {
  background: var(--v-secondary-darken1);
}
td {
  text-align: center;
  padding-left: 1rem;
  padding-right: 1rem;
}
</style>
