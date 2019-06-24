<template>
    <AppLayout>
        <span slot="toolbarTitle">Oracle of the Archons</span>
        <span slot="navigationDrawerList"
              ref="twitterFeed">
          <a class="twitter-timeline"
             data-width="300"
             data-theme="dark"
             href="https://twitter.com/Archons_Oracle?ref_src=twsrc%5Etfw">
            Tweets by Archons_Oracle
          </a>
          <!--script async
                  src="https://platform.twitter.com/widgets.js"
                  charset="utf-8">
          </script-->
        </span>
    </AppLayout>
</template>

<script>
export default {
  name: 'Oracle',
  components: {
    AppLayout: () => import('@/components/AppLayout.vue'),
  },
  mounted() {
    const self = this;
    const twitterScript = document.createElement('script');
    twitterScript.setAttribute('async', 'true');
    twitterScript.setAttribute('src', 'https://platform.twitter.com/widgets.js');
    twitterScript.setAttribute('charset', 'utf-8');
    setTimeout(() => {
      self.$nextTick(() => self.$refs.twitterFeed.appendChild(twitterScript));
    }, 100);
  },
};
</script>
