<template>
    <Entity :position="position">
        <Animation property="rotation.x" :duration="duration">
            <Key frame="0%" :value="_xStart"></Key>
            <Key frame="25%" :value="getRandom(_xStart + _x25, _xStart + _x75)"></Key>
            <Key frame="50%" :value="getRandom(_xStart + _x75, _xStart + _x125)"></Key>
            <Key frame="75%" :value="getRandom(_xStart + _x125, _xStart + _x175)"></Key>
            <Key frame="100%" :value="_xEnd"></Key>
        </Animation>
        <Animation property="rotation.y" :duration="duration">
            <Key frame="0%" :value="_yStart"></Key>
            <Key frame="25%" :value="getRandom(_yStart + _y25, _yStart + _y75)"></Key>
            <Key frame="50%" :value="getRandom(_yStart + _y75, _yStart + _y125)"></Key>
            <Key frame="75%" :value="getRandom(_yStart + _y125, _yStart + _y175)"></Key>
            <Key frame="100%" :value="_yEnd"></Key>
        </Animation>
        <Animation property="rotation.z" :duration="duration">
            <Key frame="0%" :value="_zStart"></Key>
            <Key frame="25%" :value="getRandom(_zStart + _z25, _zStart + _z75)"></Key>
            <Key frame="50%" :value="getRandom(_zStart + _z75, _zStart + _z125)"></Key>
            <Key frame="75%" :value="getRandom(_zStart + _z125, _zStart + _z175)"></Key>
            <Key frame="100%" :value="_zEnd"></Key>
        </Animation>
        <slot></slot>
    </Entity>
</template>

<script>
import { 
  Entity, 
  Animation,
  Key,
} from 'vue-babylonjs';
// eslint-disable-next-line import/no-extraneous-dependencies
import Random from '_/random';

function getRandomNonZeroInt(min, max) {
  const rand = Random.int(min, max);
  if (rand === 0) {
    return getRandomNonZeroInt(min, max);
  }
  return rand;
}

function getRandomNonZero(min, max) {
  const rand = Random.number(min, max);
  if (rand === 0) {
    return getRandomNonZero(min, max);
  }
  return rand;
}

export default {
  name: 'RotatingEntity',
  components: {
    Entity,
    Animation,
    Key,
  },
  props: {
    position: {
      type: Array,
      default: () => [0, 0, 0],
    },
    duration: {
      type: Number,
      default: () => getRandomNonZeroInt(5, 25),
    },
    xStart: {
      type: Number,
      default: () => getRandomNonZero(0, 2),
    },
    xDirection: {
      type: Number,
      default: () => getRandomNonZeroInt(-1, 2),
    },
    yStart: {
      type: Number,
      default: () => getRandomNonZero(0, 2),
    },
    yDirection: {
      type: Number,
      default: () => getRandomNonZeroInt(-1, 2),
    },
    zStart: {
      type: Number,
      default: () => getRandomNonZero(0, 2),
    },
    zDirection: {
      type: Number,
      default: () => getRandomNonZeroInt(-1, 2),
    },
  },
  computed: {
    _xStart() {
      return Math.PI * this.xStart * this.xDirection;
    },
    _x25() {
      return Math.PI * 0.25 * this.xDirection;
    },
    _x75() {
      return Math.PI * 0.75 * this.xDirection;
    },
    _x125() {
      return Math.PI * 1.25 * this.xDirection;
    },
    _x175() {
      return Math.PI * 1.75 * this.xDirection;
    },
    _xEnd() {
      // eslint-disable-next-line no-underscore-dangle
      return this._xStart + (Math.PI * 2 * this.xDirection);
    },
    _yStart() {
      return Math.PI * this.yStart * this.yDirection;
    },
    _y25() {
      return Math.PI * 0.25 * this.yDirection;
    },
    _y75() {
      return Math.PI * 0.75 * this.yDirection;
    },
    _y125() {
      return Math.PI * 1.25 * this.yDirection;
    },
    _y175() {
      return Math.PI * 1.75 * this.yDirection;
    },
    _yEnd() {
      // eslint-disable-next-line no-underscore-dangle
      return this._yStart + (Math.PI * 2 * this.yDirection);
    },
    _zStart() {
      return Math.PI * this.zStart * this.zDirection;
    },
    _z25() {
      return Math.PI * 0.25 * this.zDirection;
    },
    _z75() {
      return Math.PI * 0.75 * this.zDirection;
    },
    _z125() {
      return Math.PI * 1.25 * this.zDirection;
    },
    _z175() {
      return Math.PI * 1.75 * this.zDirection;
    },
    _zEnd() {
      // eslint-disable-next-line no-underscore-dangle
      return this._zStart + (Math.PI * 2 * this.zDirection);
    },
  },
  methods: {
    getRandom(min, max) {
      return getRandomNonZero(min, max);
    },
  },
};
</script>
