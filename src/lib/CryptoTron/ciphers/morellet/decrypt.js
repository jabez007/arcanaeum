import { encoding } from './encoding';
import * as steganography from '../steganography';

export function findSquareWidth(canvas) {
  const canvasWidth = Math.max(canvas.width, canvas.scrollWidth);
  const context = canvas.getContext('2d');
  const canvasPixelArray = context.getImageData(1, 1, canvasWidth - 1, 1).data;
  const firstRed = canvasPixelArray[0];
  const firstGreen = canvasPixelArray[1];
  const firstBlue = canvasPixelArray[2];
  const firstAlpha = canvasPixelArray[3];
  for (let i = 4; i < ((canvasWidth - 1) * 4); i += 4) {
    const red = canvasPixelArray[i];
    const green = canvasPixelArray[i + 1];
    const blue = canvasPixelArray[i + 2];
    const alpha = canvasPixelArray[i + 3];
    console.log(firstRed, firstGreen, firstBlue);
    if (red !== firstRed
      || green !== firstGreen
      || blue !== firstBlue
      || alpha !== firstAlpha) {
      console.log(
        canvasPixelArray[i + (4 * 2)],
        canvasPixelArray[i + (4 * 2) + 1],
        canvasPixelArray[i + (4 * 2) + 2],
      );
      return (i / 4);
    }
  }
  return 0;
}

export function decrypt() {
  return cipherText => steganography.decrypt(cipherText, encoding);
}
