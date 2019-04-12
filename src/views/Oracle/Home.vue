<template>
    <AppLayout>
        <span slot="toolbarTitle">Oracle of the Archons</span>
    </AppLayout>
</template>

<script>
export default {
  name: 'Oracle',
  components: {
    AppLayout: () => import('@/components/AppLayout.vue'),
  },
};
</script>
