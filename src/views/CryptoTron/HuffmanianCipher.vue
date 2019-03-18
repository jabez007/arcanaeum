<template>
    <Cipher :encryptAlgorithm="encrypt"
            :decryptAlgorithm="decrypt"
            :cipherKey="{ encoding, message }">
        <v-card slot="description">
            <v-card-title>
                <h5 class="headline">The Hoffmanian Cipher</h5>
            </v-card-title>
            <v-card-text>
                <p>
                    The Huffmanian cipher is a method of steganography (a method of hiding a secret message as opposed to just a cipher) based on the Baconian cipher. 
                    The difference between the Baconian cipher and this cipher is that this cipher uses a Huffman encoding.
                    That means instead of each letter of the plain text being replaced by a sequence of 5 characters, each letter of the plain text is replaced by a sequence of variable length.
                    This allows more common letters (like E and T) to be encoded using shorter sequences while the least common letters (like Z) are encoded using longer sequences. 
                </p>
                <p>
                    This cipher offers very little communication security, as it is a substitution cipher. 
                    As such all the methods used to cryptanalyse substitution ciphers can be used to break Baconian ciphers. 
                    The main advantage of the cipher is that it allows hiding the fact that a secret message has been sent at all.
                </p>
            </v-card-text>
        </v-card>
        <v-flex slot="key"
                xs9>
            <v-form ref="huffmanianKeyForm"
                    v-model="keyIsValid">
                <v-layout row
                          wrap
                          align-center>
                    <v-flex xs12
                            md4>
                        <v-layout row
                                  wrap>
                            <v-flex xs3
                                    v-for="(char, key) in Object.keys(encoding)"
                                    :key="key">
                                <v-text-field :label="char"
                                              v-model="encoding[char]"
                                              readonly>
                                </v-text-field>
                            </v-flex>
                        </v-layout>
                    </v-flex>
                    <v-spacer></v-spacer>
                    <v-flex xs12
                            md7>
                        <v-textarea label="False Message"
                                    v-model.trim="message"
                                    :rules="[rules.required]"
                                    clearable
                                    rows=1
                                    auto-grow
                                    required>
                        </v-textarea>
                    </v-flex>
                </v-layout>
            </v-form>
        </v-flex>
        <v-layout slot="encrypt-cipherText"
                  slot-scope="scope"
                  row
                  wrap>
            <v-flex xs12
                    md6>
                <v-textarea label="Encoding"
                            v-model="scope.cipherText"
                            prepend-inner-icon="file_copy"
                            @click:prepend-inner="scope.copyToClipboard(scope.cipherText)"
                            outline
                            auto-grow
                            readonly>
                </v-textarea>
            </v-flex>
            <v-flex xs12
                    md6>
                <v-textarea :label="`Steganograph (${message.replace(/[^a-zA-Z]/g, '').length} / ${scope.cipherText.length})`"
                            :value="enstegano(scope.cipherText, message)"
                            prepend-inner-icon="file_copy"
                            @click:prepend-inner="scope.copyToClipboard(enstegano(scope.cipherText, message))"
                            outline
                            auto-grow
                            readonly>
                </v-textarea>
            </v-flex>
        </v-layout>
    </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';

export default {
    components: {
        Cipher,
    },
    data: () => ({
        encoding: {
            A: '0000',
            B: '010011',
            C: '10100',
            D: '01000',
            E: '100',
            F: '11010',
            G: '11011',
            H: '1100',
            I: '0011',
            J: '10111011',
            K: '1011100',
            L: '00010',
            M: '10110',
            N: '0101',
            O: '0010',
            P: '000110',
            Q: '1011101001',
            R: '0111',
            S: '0110',
            T: '111', 
            U: '10101',
            V: '101111',
            W: '000111',
            X: '101110101',
            Y: '010010',
            Z: '1011101000'
        },
        message: '',
        rules: {
            required: value => !!value || 'this item is required',
        },
        keyIsValid: false,
    }),
    methods: {
        encrypt(plaintext, key) {
            const plainText = plaintext.toUpperCase();
            let cipherText = '';
            for (const char of plainText) {
                if (key.encoding[char]) {
                    cipherText += key.encoding[char];
                } else {
                    cipherText += char;
                }
            }
            return cipherText.replace(/[^01]/g, '');
        },
        enstegano(encoding, message) {
            const re = /[a-zA-Z]/;
            let steganograph = '';
            let i = 0;
            for (const char of message) {
                if (re.test(char)) {
                    if (encoding[i] === '0') {
                        steganograph += char.toLowerCase();
                        i += 1;
                    } else if (encoding[i] === '1') {
                        steganograph += char.toUpperCase();
                        i += 1;
                    }
                } else {
                    steganograph += char;
                }
            }
            return steganograph;
        },
        decrypt(ciphertext, key) {
            const reHuffman = /[^01]/;
            if (!reHuffman.test((ciphertext || '').toLowerCase().replace(/[^a-z0-9]/g, ''))) {  // we have just the encoding 
                const encoding = Object.keys(key.encoding).map(char => ({
                    char,
                    encoding: key.encoding[char],
                }));
                let block = '';
                let plainText = '';
                const cipherText = (ciphertext || '').replace(/[^01]/g, '')
                for (const char of cipherText) {
                    if (char === '0' || char === '1') {
                        block += char;
                        const enc = encoding.find(e => e.encoding === block);
                        if (enc) {
                            plainText += enc.char;
                            block = '';
                        }
                    } else {
                        plainText += char;
                    }
                }
                return plainText;
            } else if ((ciphertext || '').length > 0) {  // or we have the steganograph
                const lowerCase = /[a-z]/;
                const upperCase = /[A-Z]/;
                let encoding = '';
                for (const char of ciphertext) {
                    if (lowerCase.test(char)) {
                        encoding += '0';
                    } else if (upperCase.test(char)) {
                        encoding += '1';
                    }
                }
                return this.decrypt(encoding, key);
            }
            return '';
        },
    },
};
</script>
