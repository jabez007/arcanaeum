<template>
    <AppLayout>
        <span slot="toolbarTitle">CryptoTron</span>
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
