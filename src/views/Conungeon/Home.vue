<template>
    <AppLayout>
        <span slot="toolbarTitle">The Conungeon</span>
        <v-list slot="navigationDrawerList">
            <v-list-tile to="/conungeon/about"
                         ripple>
                <v-list-tile-action>
                    <v-icon>home</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>Home</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
            <v-list-tile to="/conungeon/three"
                         ripple>
                <v-list-tile-action>
                    <v-icon>local_drink</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>Three of Cups</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
            <v-list-tile to="/conungeon/seven"
                         ripple>
                <v-list-tile-action>
                    <v-icon>device_hub</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>Seven Channels</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
            <v-list-tile to="/conungeon/fifteen"
                         ripple>
                <v-list-tile-action>
                    <v-icon>tablet</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>Fifteen Stones</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
        </v-list>
    </AppLayout>
</template>

<script>
export default {
  name: 'Conungeon',
  components: {
    AppLayout: () => import('@/components/AppLayout.vue'),
  },
};
</script>
