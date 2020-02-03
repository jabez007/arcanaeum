import { encoding } from './encoding';
import * as steganography from '../steganography';

function hex2rgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-fA-F\d])([a-fA-F\d])([a-fA-F\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

function component2hex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

function rgb2hex(red, green, blue) {
  return `#${component2hex(red)}${component2hex(green)}${component2hex(blue)}`.toUpperCase();
}

export function findSquareWidth(canvas, key) {
  const canvasWidth = Math.max(canvas.width, canvas.scrollWidth);
  // console.log(canvasWidth);
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
    // console.log(firstRed, firstGreen, firstBlue);
    if ((red !== firstRed
      || green !== firstGreen
      || blue !== firstBlue
      || alpha !== firstAlpha)
      && colors.includes(rgb2hex(red, green, blue))) {
      // console.log(red, green, blue);
      // console.log(i / 4);
      return (i / 4);
    }
  }
  return 0;
}

export function flattenSquare(canvas, width) {
  const canvasWidth = Math.max(canvas.width, canvas.scrollWidth);
  // console.log(canvasWidth);
  const context = canvas.getContext('2d');
  const canvasColorsArray = [];
  let y = width / 2;
  while (y < canvasWidth) {
    // console.log(y);
    const row = context.getImageData(1, y, canvasWidth - 1, 1).data;
    for (let x = 0; x < ((canvasWidth - 1) * 4); x += width * 4) {
      const red = row[x];
      const green = row[x + 1];
      const blue = row[x + 2];
      // const alpha = row[x + 3];
      // console.log(rgb2hex(red, green, blue));
      canvasColorsArray.push(rgb2hex(red, green, blue));
    }
    y += width;
  }
  return canvasColorsArray;
}

export function decrypt() {
  return cipherText => steganography.decrypt(cipherText, encoding);
}
