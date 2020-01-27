// eslint-disable-next-line import/prefer-default-export
export class Square {
  constructor(origin, length, colour) {
    this.origin = origin;
    this.length = length;
    this.colour = colour;
  }

  draw(ctx) {
    // Draw clockwise
    ctx.beginPath();
    ctx.moveTo(this.origin.x, this.origin.y);
    ctx.lineTo(this.origin.x + this.length, this.origin.y);
    ctx.lineTo(this.origin.x + this.length, this.origin.y + this.length);
    ctx.lineTo(this.origin.x, this.origin.y + this.length);
    ctx.lineTo(this.origin.x, this.origin.y);
    // We want the border color and the fill color to match
    ctx.strokeStyle = this.colour;
    ctx.fillStyle = this.colour;
    // Color the border and the body
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
  }
}
