import { encoding } from './encoding';

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

function colorDifference(minuend, subtrahend) {
  if (typeof minuend === 'string') {
    return colorDifference(hex2rgb(minuend), subtrahend);
  }
  if (typeof subtrahend === 'string') {
    return colorDifference(minuend, hex2rgb(subtrahend));
  }
  // 3D distance
  return Math.sqrt(
    ((minuend.r - subtrahend.r) ** 2)
    + ((minuend.g - subtrahend.g) ** 2)
    + ((minuend.b - subtrahend.b) ** 2),
  );
}

function matchColor(searchColor, key) {
  return key.colors
    .map(c => ({ color: c, diff: colorDifference(searchColor, c) })) // calculate distance from each color
    .reduce((prev, curr) => (prev.diff < curr.diff ? prev : curr)); // reduce to smallest distance
}

function findColorWidth(canvas, key) {
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

function flattenSquare(canvas, key) {
  const colorWidth = findColorWidth(canvas, key);
  const canvasWidth = Math.max(canvas.width, canvas.scrollWidth);
  // console.log(canvasWidth);
  const context = canvas.getContext('2d');
  const canvasColorsArray = [];
  let y = colorWidth / 2;
  while (y < canvasWidth) {
    // console.log(y);
    const row = context.getImageData(1, y, canvasWidth - 1, 1).data;
    for (let x = 0; x < ((canvasWidth - 1) * 4); x += colorWidth * 4) {
      const red = row[x];
      const green = row[x + 1];
      const blue = row[x + 2];
      // const alpha = row[x + 3];
      // console.log(rgb2hex(red, green, blue));
      canvasColorsArray.push(matchColor(rgb2hex(red, green, blue), key));
    }
    y += colorWidth;
  }
  return canvasColorsArray.map(obj => obj.color);
}

function getSquareEncoding(canvas, key) {
  const colors = key.colors.map(c => c.toUpperCase());
  const canvasColors = flattenSquare(canvas, key);
  return canvasColors
    .map(c => colors.findIndex(color => color === c.toUpperCase()))
    .join('');
}

function findEncoding(block) {
  return e => (e || {}).encoding === (block || '');
}

// eslint-disable-next-line import/prefer-default-export
export function decode(canvas, key) {
  const ciphertext = getSquareEncoding(canvas, key);
  const encodingArray = Object.keys(encoding)
    .filter(k => k.length === 1)
    .map(char => ({
      char,
      encoding: encoding[char],
    }));
  let block = '';
  let plainText = '';
  for (let i = 0; i < ciphertext.length; i += 1) {
    const char = ciphertext[i];
    if (/[0-5]/.test(char)) {
      block += char;
      const enc = encodingArray.find(findEncoding(block));
      if (enc) {
        plainText += encodingArray.find(findEncoding(block)).char;
        block = '';
      }
    } else {
      plainText += char;
    }
  }
  return plainText.toLowerCase();
}
