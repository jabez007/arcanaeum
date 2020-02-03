import { encoding } from './encoding';
import * as steganography from '../steganography';

function component2hex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

function rgb2hex(red, green, blue) {
  return `#${component2hex(red)}${component2hex(green)}${component2hex(blue)}`.toUpperCase();
}

export function findSquareWidth(canvas, key) {
  const canvasWidth = Math.max(canvas.width, canvas.scrollWidth);
  const context = canvas.getContext('2d');
  // start down and in one to account for color difference on the edges
  const canvasPixelArray = context.getImageData(1, 1, canvasWidth - 1, 1).data;
  const firstRed = canvasPixelArray[0];
  const firstGreen = canvasPixelArray[1];
  const firstBlue = canvasPixelArray[2];
  const firstAlpha = canvasPixelArray[3];
  const colors = key.colors.map(c => c.toUpperCase());
  for (let i = 4; i < ((canvasWidth - 1) * 4); i += 4) {
    const red = canvasPixelArray[i];
    const green = canvasPixelArray[i + 1];
    const blue = canvasPixelArray[i + 2];
    const alpha = canvasPixelArray[i + 3];
    console.log(firstRed, firstGreen, firstBlue);
    if ((red !== firstRed
      || green !== firstGreen
      || blue !== firstBlue
      || alpha !== firstAlpha)
      && colors.includes(rgb2hex(red, green, blue))) {
      console.log(red, green, blue);
      return (i / 4);
    }
  }
  return 0;
}

export function decrypt() {
  return cipherText => steganography.decrypt(cipherText, encoding);
}
