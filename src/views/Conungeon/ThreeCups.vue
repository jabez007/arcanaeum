<template>
  <v-card width="100%" height="100%" style="overflow: hidden;">
    <v-card-title>
      <h6 class="title">The Suit of Cups Challenge</h6>
    </v-card-title>
    <v-card-text>
      <p class="body-1">
        While passing through the Spire on her travels, a zingara granted each inhabitant a simple cast of her tarot.
        Below is the reading you recieved, but the zingra then called for you to not accept the authority of the tarot over your fate.
        She revleaved to you that it is possible to exercise your own governance over the tarot and thus your fate.
        To do this, she explained, you must recognize that the three aspects of the cast tarot are joined.
        In order to move your potential, you must also move either your path or yourself.
      </p>
      <p>Once you've understood this, she then challenged you improve your lot by turning each of your cast tarot upright...</p>
    </v-card-text>
    <br>
    <v-layout row justify-space-around>
      <v-flex v-for="(cup, i) in cups" :key="cup.name" xs3 fill-height>
        <p class="subheading">{{ `${i === 0 ? 'You' : i === 1 ? 'Your Path' : 'Your Potential'}` }}</p>
        <v-fade-transition>
          <p class="body-2" v-if="`${cup.name}OfCups` in $refs">
            <v-slide-x-transition hide-on-leave>
              <span
                key="upright"
                v-show="$refs[`${cup.name}OfCups`][0].getNode().rotation() === 0"
              >{{ cup.upright }}</span>
            </v-slide-x-transition>
            <v-slide-x-reverse-transition hide-on-leave>
              <span
                key="reversed"
                v-show="$refs[`${cup.name}OfCups`][0].getNode().rotation() === 180"
              >{{ cup.reversed }}</span>
            </v-slide-x-reverse-transition>
          </p>
        </v-fade-transition>
      </v-flex>
    </v-layout>
    <v-layout row fill-height align-center align-content-center>
      <v-spacer></v-spacer>
      <v-flex fill-height ref="konva" style="color: gray;">
        <v-stage
          ref="stage"
          :config="{
            width: cardWidth * 3,
            height: konvaHeight,
          }"
        >
          <v-layer>
            <v-rect
              :config="{
                width: cardWidth * 3,
                height: konvaHeight,
                cornerRadius: cardWidth * 0.1,
                fillLinearGradientStartPoint: { x: (cardWidth * 3) * getRandom(1, 2), y: -(konvaHeight * getRandom(0, 1)) },
                fillLinearGradientEndPoint: { x: -((cardWidth * 3) * getRandom(0, 1)), y: konvaHeight * getRandom(1, 2) },
                fillLinearGradientColorStops: [0, '#778899', 1, '#2F4F4F'],  // light slate gray -> dark slate gray
              }"
            ></v-rect>
          </v-layer>
          <v-layer ref="layer">
            <v-rect
              v-for="(cup, i) in cups"
              :key="i"
              :ref="`${cup.name}OfCups`"
              :config="{
                name: cup.name,
                x: cardWidth * i,
                y: 0,
                width: cardWidth,
                height: konvaHeight,
                cornerRadius: cardWidth * getRandom(0.1, 0.2),
                fillPatternImage: cup.image,
                fillPatternScale: { x: cardWidth / 1200, y: konvaHeight / 1976 },
                rotation: i === flipped ? 180 : 0,
                offsetX: i === flipped ? cardWidth : 0,
                offsetY: i === flipped ? konvaHeight : 0,
                shadowColor: 'black',
                shadowBlur: 10,
                shadowOffsetX: 5,
                shadowOffsetY: 5,
                shadowOpacity: 0.6
              }"
              @click="handleClick"
            ></v-rect>
          </v-layer>
        </v-stage>
      </v-flex>
      <v-spacer></v-spacer>
    </v-layout>
  </v-card>
</template>

<script>
const CUPS = [
  {
    name: 'ace',
    upright:
      'Ace of cups is the card for new love, compassion, joy and creativity.',
    reversed:
      'Ace of Cups reversed indicates blocked creativity and blocked emotions. Access to the subconscious mind and psychic ability is also blocked.',
  },
  {
    name: 'page',
    upright:
      'Page of cups denotes a young person with a gentle and sensitive nature. This is someone who lives in wonder and can be quite naive at times.',
    reversed:
      'Page of Cups reversed indicates someone who is hard to motivate, they are feeling sad and bring down others with their gloomy nature. They might promise a lot, but deliver little if any.',
  },
  {
    name: 'knight',
    upright:
      'Knight of cups denotes a person on a quest to declare his love. This is your knight in shining armor. He is a singer, poet, and writer. He paints and creates wherever he goes. He is artistic and incredibly lovable.',
    reversed:
      'Knight of Cups reversed indicates a person who is walking away from a relationship and/or a creative venture. The emotional state of the seeker might be far from romantic, instead it is more likely to be cynical and uses their insights and intuition to make others hurt as much as they do.',
  },
  {
    name: 'queen',
    upright:
      'Queen of cups denotes a woman who is highly intuitive and sensitive. She is in touch with her emotions, her subconscious, and the universe. She is compassionate and cares deeply about her life and those in it.',
    reversed:
      'Queen of Cups reversed indicates someone with blocked psychic abilities and an emotionally unstable nature. This person might be very numb or even worse, has very dark feelings.',
  },
  {
    name: 'king',
    upright:
      'King of cups denotes a warm, honest and generous man who is kind and fair. This is someone who is in control over his own emotions. ',
    reversed:
      'King of Cups reversed indicates someone who is blocked expressing their feelings, is unable to motivate and be motivated. This is someone with a selfish streak, often born from fear of rejection. ',
  },
];

const WIDTHOVERHEIGHT = 1200 / 1976;

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
}

export default {
  name: 'ThreeCups',
  data: () => ({
    konvaBaseDim: 0,
    cups: [],
    flipped: getRandomInt(0, 3),
    selected: [],
  }),
  computed: {
    konvaHeight() {
      return this.konvaBaseDim;
    },
    cardWidth() {
      return this.konvaBaseDim / 3 / WIDTHOVERHEIGHT;
    },
  },
  created() {
    const self = this;
    for (let i = 0; i < 3; i += 1) {
      const cup = CUPS.splice(getRandomInt(0, CUPS.length), 1)[0];
      const image = new Image();
      image.onload = () => {
        // assign the onload event before assining the src.
        cup.image = image;
        self.cups.push(cup);
      };
      image.src = require(`@/assets/Conungeon/ThreeCups/${cup.name}.jpg`);
    }
  },
  mounted() {
    window.vueCups = window.vueCups || this;
    this.konvaBaseDim = Math.min(
      this.$refs.konva.clientHeight,
      this.$refs.konva.clientWidth,
    );
    const self = this;
    this.$nextTick(() => setTimeout(() => self.$forceUpdate(), 200));
  },
  beforeDestroy() {
    if (window.vueCups === this) {
      window.vueCups = null;
    }
  },
  methods: {
    getRandom(min, max) {
      return Math.random() * (max - min) + min;
    },
    handleClick(e) {
      const card = e.target;
      if (!this.selected.find(cc => cc.name() === card.name())) {
        card.to({
          duration: 0.3,
          shadowColor: 'rgba(65,105,225,1)', // royal blue
          shadowOffsetX: 15,
          shadowOffsetY: 15,
        });
        this.selected.push(card);
      }
      if (this.selected.length === 2) {
        const self = this;
        this.$nextTick(() => {
          self.selected.forEach((cc) => {
            cc.to({
              duration: 0.3,
              shadowColor: 'black',
              shadowOffsetX: 5,
              shadowOffsetY: 5,
              rotation: cc.rotation() === 0 ? 180 : 0,
              offsetX: cc.rotation() === 0 ? self.cardWidth : 0,
              offsetY: cc.rotation() === 0 ? self.konvaHeight : 0,
            });
          });
          self.selected.splice(0, self.selected.length);
          setTimeout(() => self.$forceUpdate(), 500);
        });
      }
    },
  },
};
</script>
