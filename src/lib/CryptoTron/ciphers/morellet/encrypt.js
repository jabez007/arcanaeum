import { encoding } from './encoding';
import { Square } from './square';
import * as steganography from '../steganography';

export function encode(plainText) {
  return steganography.encode(plainText, encoding).replace(/[^0-5]/g, '');
}

export function enstegano(key) {
  return (encodedString) => {
    const rowLength = Math.ceil(Math.sqrt(encodedString.length));
    const squareLength = key.width / (rowLength || 1);
    if (key.context) {
      key.context.clearRect(0, 0, key.width, key.width);
    }
    for (let i = 0; i < encodedString.length; i += 1) {
      const y = Math.floor(i / rowLength);
      const x = i % rowLength;
      new Square(
        {
          x: x * squareLength,
          y: y * squareLength,
        },
        squareLength,
        key.colors[encodedString[i]],
      ).draw(key.context);
    }
    return encodedString;
  };
}

export function encrypt(key) {
  return plainText => enstegano(key)(encode(plainText));
}
