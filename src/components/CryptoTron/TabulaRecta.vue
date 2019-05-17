<template>
  <!--pre>
        A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
        ---------------------------------------------------
    A   A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
    B   B C D E F G H I J K L M N O P Q R S T U V W X Y Z A
    C   C D E F G H I J K L M N O P Q R S T U V W X Y Z A B
    D   D E F G H I J K L M N O P Q R S T U V W X Y Z A B C
    E   E F G H I J K L M N O P Q R S T U V W X Y Z A B C D
    F   F G H I J K L M N O P Q R S T U V W X Y Z A B C D E
    G   G H I J K L M N O P Q R S T U V W X Y Z A B C D E F
    H   H I J K L M N O P Q R S T U V W X Y Z A B C D E F G
    I   I J K L M N O P Q R S T U V W X Y Z A B C D E F G H
    J   J K L M N O P Q R S T U V W X Y Z A B C D E F G H I
    K   K L M N O P Q R S T U V W X Y Z A B C D E F G H I J
    L   L M N O P Q R S T U V W X Y Z A B C D E F G H I J K
    M   M N O P Q R S T U V W X Y Z A B C D E F G H I J K L
    N   N O P Q R S T U V W X Y Z A B C D E F G H I J K L M
    O   O P Q R S T U V W X Y Z A B C D E F G H I J K L M N
    P   P Q R S T U V W X Y Z A B C D E F G H I J K L M N O
    Q   Q R S T U V W X Y Z A B C D E F G H I J K L M N O P
    R   R S T U V W X Y Z A B C D E F G H I J K L M N O P Q
    S   S T U V W X Y Z A B C D E F G H I J K L M N O P Q R
    T   T U V W X Y Z A B C D E F G H I J K L M N O P Q R S
    U   U V W X Y Z A B C D E F G H I J K L M N O P Q R S T
    V   V W X Y Z A B C D E F G H I J K L M N O P Q R S T U
    W   W X Y Z A B C D E F G H I J K L M N O P Q R S T U V
    X   X Y Z A B C D E F G H I J K L M N O P Q R S T U V W
    Y   Y Z A B C D E F G H I J K L M N O P Q R S T U V W X
    Z   Z A B C D E F G H I J K L M N O P Q R S T U V W X Y
  </pre-->
  <table style="font-family: monospace, monospace;">
      <thead>
          <th></th>
          <th v-for="i in 26" :key="i">
              {{ String.fromCharCode(64 + i) }}
          </th>
      </thead>
      <tr v-for="j in 26" :key="j">
          <th style="background: var(--v-secondary-base);">
              {{ String.fromCharCode(64 + j) }}
          </th>
          <td v-for="k in 26" :key="k">
              {{ String.fromCharCode(65 + (((j - 1) + (k - 1)) % 26)) }}
          </td>
      </tr>
  </table>
</template>

<script>
export default {
  name: 'TabulaRecta',
};
</script>

<style scoped>
table {
    width: 100%;
    border-spacing: 1px;
    border-collapse: separate;
}
th {
    text-align: center;
}
tr {
    background: var(--v-primary-base);
}
tr:nth-child(odd) {
    background: var(--v-info-lighten1)
}
tr:nth-child(even) {
    background: var(--v-info-darken1)
}
td {
  text-align: center;
}
</style>
