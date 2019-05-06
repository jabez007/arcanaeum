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
                        <v-list-tile-title>Rail-Fence Cipher</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
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
                        <v-list-tile-title>Caesar Cipher</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/affine"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Affine Cipher</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/baconian"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Baconian Cipher</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/huffmanian"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Huffmanian Cipher</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/autokey"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Autokey Cipher</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
            <v-list-group prepend-icon="grid_on"
                          active-class=""
                          value="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>Square</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/polybius"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Polybius Square Cipher</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
            <v-list-group prepend-icon="sort_by_alpha"
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
                        <v-list-tile-title>Autokey Cipher</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Vigenère and Gronsfeld Cipher</v-list-tile-title>
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
