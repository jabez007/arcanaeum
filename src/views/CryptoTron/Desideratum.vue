<template>
  <v-card class="text-xs-center">
    <v-card-title>
        <v-spacer></v-spacer>
        <h3 class="display-2">Kerckhoffs's Desideratum of Cryptography</h3>
        <v-btn href="https://en.wikipedia.org/wiki/Kerckhoffs's_principle"
               target="_blank"
               icon
               small>
          <v-icon>info</v-icon>
        </v-btn>
        <v-spacer></v-spacer>
    </v-card-title>
    <v-card-text>
        <p class="subheading">
          Stated by Netherlands born cryptographer Auguste Kerckhoffs in the 19th century:<br />
          <span class="font-italic">
            A cryptosystem should be secure even if everything about the system,
            except the key, is public knowledge.
          </span>
        </p>
        <p class="body-2">
          This principle was reformulated (or possibly independently formulated) by American
          mathematician Claude Shannon as "the enemy knows the system",
          <br /> i.e.,<br />
          <span class="font-italic">
            "one ought to design systems under the assumption that the enemy will immediately gain
            full familiarity with them".
          </span>
          <br />
          In that form, it is called Shannon's maxim.
        </p>
        <p class="body-1">
          This concept is widely embraced by cryptographers,
          in contrast to "security through obscurity", which is not.
          The algorithm for a cipher may be kept secret though.
          However, it should not be part of the cipher algorithm's assumptions that it must be
          kept secret to maintain security.
          The decision to keep an algorithm secret should only be in keeping with a layered
          security posture.
        </p>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'Desideratum',
};
</script>
