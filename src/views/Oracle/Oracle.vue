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
    <v-card>
      <v-card-title>
        <v-text-field :label="`Seed text (${(seed || '').length} / ${seedLength})`"
                      v-model.trim="seed"
                      :maxlength="seedLength"
                      :disabled="!model || (charVectors || []).length < 38"
                      :readonly="running"
                      @keypress.enter="generateText(seed)"
                      clearable
                      required>
        </v-text-field>
        <v-spacer></v-spacer>
        <v-slider label="Temperature"
                  hint="Closer to 0 will generate more accurate text, closer to 1 generate more 'creative' text"
                  persistent-hint
                  v-model="temperature"
                  validate-on-blur
                  :min="0.01"
                  :max="1"
                  :step="0.01"
                  thumb-label
                  :disabled="!model || (charVectors || []).length < 38"
                  :readonly="running">
        </v-slider>
        <v-spacer></v-spacer>
        <v-text-field label="Generated Length"
                      type="number"
                      v-model.number="maxLength"
                      :disabled="!model || (charVectors || []).length < 38"
                      :readonly="running">
        </v-text-field>
      </v-card-title>
      <v-card-text>
        <v-textarea label="Generated text"
                    v-model="generatedText"
                    :loading="running"
                    prepend-inner-icon="refresh"
                    @click:prepend-inner="generateText(seed)"
                    append-icon="share"
                    @click:append="shareWisdom"
                    readonly>
        </v-textarea>
      </v-card-text>
    </v-card>
  </v-card>
</template>

<script>
import * as tf from '@tensorflow/tfjs';
// import { Twitter } from 'twitter-node-client';
const char2vec = require('@/assets/Oracle/char2vec.json');

const SEEDLENGTH = 17;

async function sample(probs, temperature) {
  // https://github.com/tensorflow/tfjs-examples/blob/f979101509211fc8e1485ba527a9cc7bef3237d3/lstm-text-generation/model.js
  return tf.tidy(async () => {
    const logits = tf.div(tf.log(probs), Math.max(temperature, 1e-6));
    const isNormalized = false;
    // `logits` is for a multinomial distribution, scaled by the temperature.
    // We randomly draw a sample from the distribution.
    return (await tf.multinomial(logits, 1, null, isNormalized).data())[0];
  });
}

// const twitter = new Twitter(require('@/assets/Oracle/twitter_config.json'));

/* const onError = (err, response, body) => {
  console.log('ERROR [%s]', err);
};
const onSuccess = (data) => {
  console.log('Data [%s]', data);
}; */

export default {
  name: 'OracleAbout',
  data: () => ({
    model: null,
    charVectors: [],
    seed: '',
    temperature: 0.5,
    maxLength: 140,
    running: false,
    generatedText: '',
  }),
  computed: {
    seedLength() {
      return SEEDLENGTH;
    },
  },
  async created() {
    this.model = await tf.loadLayersModel('https://raw.githubusercontent.com/jabez007/arcanaeum/master/weights/model.json');
    this.charVectors = Object.keys(char2vec).map(key => ({ char: key, vec: char2vec[key] }));
  },
  methods: {
    async generateText(seedText) {
      const self = this;
      const seed = (seedText || '').toLowerCase().replace(/[^0-9a-z_ ]/g, '');
      if (seed.length >= this.seedLength && seed.length < this.maxLength) {
        this.running = true;
        const input = seed.substring(seed.length - this.seedLength).split('').map(char => self.charVectors.find(cv => cv.char === char).vec);
        const probsArray = await this.model.predict(tf.tensor3d([input]));
        const pred = await sample(probsArray, this.temperature);
        const predChar = this.charVectors.find(cv => cv.vec[pred]).char;
        return this.generateText(seed + predChar);
      }
      this.running = false;
      this.generatedText = seed;
      return seed;
    },
    shareWisdom() {
      // const self = this;
      if (!this.running) {
        if (this.generatedText.length >= this.maxLength) {
          /* twitter.postTweet({
            status: self.generatedText.substring(self.generatedText.length - this.maxLength),
          }, onError, onSuccess); */
        }
      }
    },
  },
};
</script>
