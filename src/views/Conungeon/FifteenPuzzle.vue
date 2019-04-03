<template>
  <v-card width="100%" height="100%" style="overflow: hidden;">
    <v-card-title>
      <h6 class="title">The Fifteen Mana Stone Tablet</h6>
    </v-card-title>
    <v-card-text>
      <p class="body-1">
        Unearthed by the Magi of the Archons while reconnoitring the mountains around the Spire,
        this slate tablet has fifteen mana stones mounted to it in a grid-like fashion.
        It was quickly discovered that these mana stones could not be removed from the slate by any means known to the Magi,
        but could be slid along the surface of the tablet to rearrange the order of the lattice structure.
        After much tinkering with this atifact at the Spire,
        we have yet to ascertain the purpose of the tablet or the consequence of properly aligning the array of mana stones.
        However, the Magi are all but certain they have discerned the precise distribution required of the mana stones, and labeled them as such.
        For all of their attempts, the Magi have been able to achieve this pattern except for two stones.
      </p>
      <p>That is where you come in...</p>
    </v-card-text>
    <br>
    <v-layout row fill-height align-center align-content-center>
        <v-flex ref="konva">

        </v-flex>
    </v-layout>
  </v-card>
</template>

<script>
export default {
  name: "FifteenPuzzle"
};
</script>
