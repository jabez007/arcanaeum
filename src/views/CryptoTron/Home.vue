<template>
    <AppLayout>
        <span slot="toolbarTitle">CryptoTron</span>
        <v-list slot="navigationDrawerList">
            <v-list-tile to="/cryptotron/about"
                         ripple>
                <v-list-tile-action>
                    <v-icon>home</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>Home</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
            <v-list-tile to="/cryptotron/desideratum"
                         ripple>
                <v-list-tile-action>
                    <v-icon>new_releases</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>Kerckhoffs's Desideratum</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
            <v-subheader>
                Ciphers
            </v-subheader>
            <v-list-group prepend-icon="find_replace"
                          active-class=""
                          :value="$router.currentRoute.path === '/cryptotron/substitution'">
                <v-list-tile slot="activator"
                             @click="$router.push('/cryptotron/substitution')">
                    <v-list-tile-content>
                        <v-list-tile-title>Substitution</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/caesar"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Caesar</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/affine"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Affine</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Beaufort</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Running Key</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Hill</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
            <v-list-group prepend-icon="swap_horiz"
                          active-class=""
                          value="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>Transposition</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/railfence"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Rail-Fence</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/columnar-transposition"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Columnar</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
            <v-list-group prepend-icon="message"
                          active-class=""
                          value="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>Steganography</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/bacon"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Baconian</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/huffman"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Huffmanian</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
            <v-list-group prepend-icon="border_inner"
                          active-class=""
                          :value="$router.currentRoute.path === '/cryptotron/polybius'">
                <v-list-tile slot="activator"
                             @click="$router.push('/cryptotron/polybius')">
                    <v-list-tile-content>
                        <v-list-tile-title>Polybius Square</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">ADFG(V)X</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Bifid</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Trifid</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
            <v-list-group prepend-icon="clear_all"
                          active-class=""
                          value="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>Polyalphabetic</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/autokey"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Autokey</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Vigenère</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Enigma</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
            <v-list-group prepend-icon="tab_unselected"
                          active-class=""
                          value="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>Square</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Four-Square</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title class="text-xs-center">Playfair</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
        </v-list>
    </AppLayout>
</template>

<script>
export default {
  name: 'CryptoTron',
  components: {
    AppLayout: () => import('@/components/AppLayout.vue'),
  },
};
</script>
