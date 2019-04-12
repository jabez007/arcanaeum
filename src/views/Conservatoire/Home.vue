<template>
    <AppLayout>
        <span slot="toolbarTitle">Conservatoire</span>
        <v-list slot="navigationDrawerList">
            <v-list-tile to="/conservatoire/about"
                         ripple>
                <v-list-tile-action>
                    <v-icon>home</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>Home</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
            <v-list-tile to="/conservatoire/journal"
                         ripple>
                <v-list-tile-action>
                    <v-icon>book</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>Syndar Journal</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
            <v-list-tile to="/conservatoire/allonsy"
                         ripple>
                <v-list-tile-action>
                    <v-icon>transform</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>Project Allons-y</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
            <v-list-tile to="/conservatoire/construct"
                         ripple>
                <v-list-tile-action>
                    <v-icon>layers</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>Mana Construct</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
        </v-list>
    </AppLayout>
</template>

<script>
export default {
  name: 'Conservatoire',
  components: {
    AppLayout: () => import('@/components/AppLayout.vue'),
  },
};
</script>
