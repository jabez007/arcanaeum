<template>
  <v-card class="text-xs-center">
    <img alt="CryptoTron logo" src="../../assets/CryptoTron/logo.png">
    <v-card-title>
        <v-spacer></v-spacer>
        <h2 class="display-3">Welcome to CryptoTron</h2>
        <v-spacer></v-spacer>
    </v-card-title>
    <v-card-text>
        <p class="subheading">
            CryptoTron contains implementations of various ciphers from
            <a href="http://www.practicalcryptography.com/ciphers/" target="_blank">Practical Cryptography</a>
            by leveraging Vue's
            <a href="https://vuejs.org/v2/guide/single-file-components.html" target="_blank">single file components</a>
            with
            <a href="https://vuejs.org/v2/guide/components-slots.html" target="_blank">slots</a>
            in order to reuse as much code as possible.
            <br />
            This should allow for the easy addition of ciphers to CryptoTron with only needing to write the methods for encryption and decryption of a cipher.
        </p>
        <p class="text-xs-left caption">
          Other Resources
          <ul>
            <li>
              <a href="https://www.cryptogram.org/resource-area/cipher-types/" target="_blank">American Cryptogram Association</a>
            </li>
          </ul>
        </p>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'CryptoTronAbout',
};
</script>
