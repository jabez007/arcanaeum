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
            <v-list-group prepend-icon="find_replace"
                          active-class=""
                          value="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>Substitution</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/caesar"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Caesar</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/affine"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Affine</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/autokey"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Autokey</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Beaufort</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Running Key</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Hill</v-list-tile-title>
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
                        <v-list-tile-title>Rail-Fence</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Columnar</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
            <v-list-group prepend-icon="border_inner"
                          active-class=""
                          value="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>Polybius Square</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/polybius"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Polybius Square</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>ADFG(V)X</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Bifid</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Trifid</v-list-tile-title>
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
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Vigenère and Gronsfeld</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Enigma</v-list-tile-title>
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
                        <v-list-tile-title>Four-Square</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Playfair</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
            <v-divider></v-divider>
            <v-list-group prepend-icon="message"
                          active-class=""
                          value="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>Steganography</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/baconian"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Baconian</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/huffmanian"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Huffmanian</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Grille</v-list-tile-title>
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
