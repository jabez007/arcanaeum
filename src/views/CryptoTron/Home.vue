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
            <v-list-group prepend-icon="swap_horiz"
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
            <v-list-group prepend-icon="spellcheck"
                          value="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>Monoalphabetic Substitution</v-list-tile-title>
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
                <v-list-tile @click=""
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Baconian Cipher</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
            <v-list-group prepend-icon="grid_on"
                          value="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>Grid Substitution</v-list-tile-title>
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
                          value="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>Polyalphabetic Substitution</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile to="/cryptotron/autokey"
                             ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>Autokey Cipher</v-list-tile-title>
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
