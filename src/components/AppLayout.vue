<template>
    <v-app dark>
        <v-toolbar app
                   fixed
                   clipped-left>
            <v-toolbar-side-icon v-if="navigationDrawer"
                                 @click.stop="drawer = !drawer">
            </v-toolbar-side-icon>
            <v-toolbar-title>
                <slot name="toolbarTitle">
                </slot>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items>
                <slot name="toolbarItems">
                </slot>
            </v-toolbar-items>
            <v-btn to="/"
                   icon>
                <v-icon>local_library</v-icon>
            </v-btn>
        </v-toolbar>
        <v-navigation-drawer v-if="navigationDrawer"
                             v-model="drawer"
                             app
                             fixed
                             clipped>
            <slot name="navigationDrawerList">
            </slot>
        </v-navigation-drawer>
        <v-content>
            <v-container fluid
                         fill-height>
                <v-layout justify-center
                          align-center>
                    <transition :name="transitionName"
                                mode="out-in">
                        <router-view />
                    </transition>
                </v-layout>
            </v-container>
        </v-content>
        <v-footer class="pa-3"
                  app
                  dark>
            <v-spacer></v-spacer>
            &copy; {{ new Date().getFullYear() }}
        </v-footer>
    </v-app>
</template>

<script>
export default {
    name: 'AppLayout',
    data: () => ({
        drawer: true,
        transitionName: 'fade-transition',
    }),
    computed: {
        navigationDrawer() {
            return !!this.$slots.navigationDrawerList;
        }
    },
    watch: {
        $route(to, from) {
            const toDepth = to.path.split('/').length;
            const fromDepth = from.path.split('/').length;
            if (toDepth < fromDepth) { // moving up
                this.transitionName = 'slide-y-reverse-transition';
            } else if (toDepth > fromDepth) { // moving down
                this.transitionName = 'slide-y-transition';
            } else { // moving laterally
                this.transitionName = 'slide-x-transition';
            }
        },
    },
};
</script>

