<template>
  <v-card class="text-xs-center">
    <v-card-title>
        <v-spacer></v-spacer>
        <h2 class="display-3">Wisdom from the Oracle of the Archons</h2>
        <v-spacer></v-spacer>
    </v-card-title>
    <v-card-text>
        <p class="subheading">
            This 'Oracle' generates its messages from a
            <a href="https://www.kaggle.com/jabez007/archonsoracletrainer" target="_blank">Long-Short-Term-Memory machine learning model</a>
            trained on 
            <a href="https://repl.it/@jabez007/LastHopeScrape" target="_blank">text compiled</a>
            from the
            <a href="http://lasthope.kitsufox.com/wiki/player-driven-content/" target="_blank">Last Hope LARP player driven content</a>
        </p>
        <p>
            Feel free to fork either of those scripts, and see if we can make this 'Oracle' even better
        </p>
    </v-card-text>
    <!-- run model here -->
  </v-card>
</template>

<script>
export default {
  name: 'OracleAbout',
};
</script>
