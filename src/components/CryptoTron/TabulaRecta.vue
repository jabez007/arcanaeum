<template>
  <v-dialog v-model="dialog" width="760">
    <template v-slot:activator="{ on }">
      <a class="yellow--text text--darken-4" v-on="on">Tabula Recta</a>
    </template>
    <v-card style="z-index: inherit;">
      <v-layout row>
        <v-spacer></v-spacer>
        <v-btn icon @click="dialog = !dialog">
          <v-icon>close</v-icon>
        </v-btn>
      </v-layout>
      <v-card-text>
        <table>
          <thead>
            <th></th>
            <th v-for="i in 26" :key="i">{{ String.fromCharCode(64 + i) }}</th>
          </thead>
          <tbody>
            <tr v-for="j in 26" :key="j">
              <th>{{ String.fromCharCode(64 + j) }}</th>
              <td
                v-for="k in 26"
                :key="k"
              >{{ String.fromCharCode(65 + (((j - 1) + (k - 1)) % 26)) }}</td>
            </tr>
          </tbody>
        </table>
      </v-card-text>
    </v-card>
  </v-dialog>
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
</template>

<script>
export default {
  name: 'TabulaRecta',
  data: () => ({
    dialog: false,
  }),
};
</script>

<style scoped>
table {
  border-spacing: 0px;
  border-collapse: separate;
  font-family: monospace, monospace;
  overflow: hidden;
  width: 100%;
}
td,
th {
  position: relative;
  text-align: center;
}
td:hover::after,
thead th:not(:empty):hover::after,
td:focus::after,
thead th:not(:empty):focus::after {
  content: '';
  height: 10000px;
  left: 0;
  position: absolute;
  top: -5000px;
  width: 100%;
  z-index: -1;
}
td:hover::after,
th:hover::after {
  background-color: var(--v-primary-base);
}
th {
  font-size: larger;
}
/*
tr:nth-child(odd) {
  background: var(--v-secondary-lighten1);
}
tr:nth-child(even) {
  background: var(--v-secondary-darken1);
}
*/
tr:hover {
  background-color: var(--v-primary-base);
}
/* Focus stuff for mobile */
td:focus::before,
tbody th:focus::before {
  background-color: var(--v-primary-base);
  content: '';
  height: 100%;
  top: 0;
  left: -5000px;
  position: absolute;
  width: 10000px;
  z-index: -1;
}
</style>
