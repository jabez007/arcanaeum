<template>
  <v-card>
    <slot name="description"></slot>
    <v-card>
      <v-card-title>
        <v-flex xs1>
          <v-icon large>
            vpn_key
          </v-icon>
        </v-flex>
        <v-flex d-flex offset-xs1>
          <slot name="key"></slot>
        </v-flex>
        <v-spacer></v-spacer>
      </v-card-title>
      <v-tabs grow>
        <v-tab key="encrypt">
          Encrypt
        </v-tab>
        <v-tab key="decrypt">
          Decrypt
        </v-tab>
        <v-tab v-if="keysGenerator"
               key="crack">
          Cryptanalysis
        </v-tab>
        <v-tab-item key="encrypt"
                    lazy>
          <EncryptMessage :encryptAlgorithm="encryptAlgorithm"
                          :cipherKey="cipherKey"
                          @success="onSuccess"
                          @error="onError" />
        </v-tab-item>
        <v-tab-item key="decrypt"
                    lazy>
          <DecryptMessage :decryptAlgorithm="decryptAlgorithm"
                          :cipherKey="cipherKey"
                          @success="onSuccess"
                          @error="onError" />
        </v-tab-item>
        <v-tab-item v-if="keysGenerator"
                    key="crack"
                    lazy>
          <CrackMessage :decryptAlgorithm="decryptAlgorithm"
                        :ngramsFile="ngramsFile"
                        :keysGenerator="keysGenerator"
                        @update-key="$emit('update-key', $event)" />
        </v-tab-item>
      </v-tabs>
    </v-card>
    <v-snackbar v-model="openSnackbar"
                :color="status"
                :timeout="snackbarTimeout"
                vertical>
      {{ statusMessage }}
      <v-icon @click="openSnackbar = false">
        close
      </v-icon>
    </v-snackbar>
  </v-card>
</template>

<script>
export default {
  name: 'Cipher',
  components: {
    // @ is an alias to /src
    EncryptMessage: () => import('@/components/CryptoTron/EncryptMessage.vue'),
    DecryptMessage: () => import('@/components/CryptoTron/DecryptMessage.vue'),
    CrackMessage: () => import('@/components/CryptoTron/CrackMessage.vue'),
  },
  props: {
    encryptAlgorithm: {
      type: Function,
      required: true,
    },
    decryptAlgorithm: {
      type: Function,
      required: true,
    },
    cipherKey: {
      type: Object,
      required: true,
    },
    keysGenerator: {
      type: Function,
      required: false,
    },
    ngramsFile: {
      type: String,
      default: 'quadgrams',
    },
  },
  data: () => ({
    openSnackbar: false,
    snackbarTimeout: 2000,
    status: '',
    statusMessage: '',
  }),
  methods: {
    onSuccess(message) {
      this.openSnackbar = false;
      this.status = 'success';
      this.statusMessage = message;
      this.openSnackbar = true;
    },
    onError(message) {
      this.openSnackbar = false;
      this.status = 'error';
      this.statusMessage = message;
      this.openSnackbar = true;
    },
  },
};
</script>

<style scoped>
.v-card__text {
  overflow: scroll;
}
</style>