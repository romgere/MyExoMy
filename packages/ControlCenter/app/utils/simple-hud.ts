import type { ProximitySensorPosition } from '@robot/shared/events';
import { MotorSpeed, MotorAngle } from '@robot/shared/types';

function radians(degrees: number) {
  return degrees * (Math.PI / 180);
}

// https://github.com/SB3NDER/simple-hud
type ProximityValue = 0 | 1 | 2 | 3 | 4;

export type HUDData = {
  pitch: number;
  roll: number;
  heading: number;
  flight: {
    pitch: number;
    heading: number;
  };
  distance: number;
  throttle: MotorSpeed;
  direction: MotorAngle;
  info1: string;
  proximity: Record<ProximitySensorPosition, ProximityValue>;
};

export const defaultHudData: HUDData = {
  pitch: 0,
  roll: 0,
  heading: 0,
  flight: {
    pitch: 0,
    heading: 0,
  },
  distance: 0,
  // speed: 0,
  throttle: [0, 0, 0, 0, 0, 0] as MotorSpeed,
  direction: [0, 0, 0, 0, 0, 0] as MotorAngle,
  info1: 'hello',
  proximity: { FR: 0, FL: 3, RR: 1, RL: 0 },
};

type HUDDataCallback = () => HUDData;

type HUDStyle = {
  lineWidth: number;
  color: string;
  font: {
    style: string;
    variant: string;
    weight: string;
    family: string;
    scale: number;
  };
  hasShadow: boolean;
  shadow: {
    blur: number;
    color: string;
    offset: number;
  };
  scale: number; // ui scale
  stepWidth: number;
};

class Settings {
  declare _pixelPerDeg: number; // pixel per degree
  declare _pixelPerRad: number; // pixels per radiant

  set pixelPerDeg(val: number) {
    this._pixelPerDeg = val;
    this._pixelPerRad = val * (180 / Math.PI);
  }

  set pixelPerRad(val: number) {
    this._pixelPerRad = val;
    this._pixelPerDeg = val * (Math.PI / 180);
  }

  uncagedMode: boolean = true; // align pitch ladders to flight path
  rollRadius: 'none' | 'exact' | 'center' = 'exact'; // 'none' / 'exact' / 'center'
  timezone?: string; // default local time, ex. 'America/Los_Angeles' or 'Asia/Tokyo'
  scale: number = 1; // resolution scale
}

export default class HUD {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  running: boolean;
  data: HUDData;
  settings: Settings;
  style: HUDStyle;
  size: { width: number; height: number };
  cb: HUDDataCallback;

  constructor(canvas: HTMLCanvasElement, cb: HUDDataCallback) {
    this.canvas = canvas;
    const ctx = this.canvas.getContext('2d');

    if (!ctx) {
      throw 'Error getting canvas 2D context';
    }

    this.cb = cb;
    this.ctx = ctx;

    this.running = false;

    this.data = defaultHudData;

    this.settings = new Settings();

    // set both the degree and radiant variant
    this.settings.pixelPerDeg = 12;

    this.style = {
      lineWidth: 2,
      color: 'rgba(0, 255, 127, 1)',
      font: {
        style: 'normal',
        variant: 'normal',
        weight: 'normal',
        family: 'Arial',
        scale: 1,
      },
      hasShadow: true,
      shadow: {
        blur: 2,
        color: 'black',
        offset: 2,
      },
      scale: 1, // ui scale
      stepWidth: 12,
    };

    // set virtual size(res)
    this.size = {
      width: this.canvas.clientWidth / this.style.scale,
      height: this.canvas.clientHeight / this.style.scale,
    };

    // set real size(res)
    this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio * this.settings.scale;
    this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio * this.settings.scale;

    // scale
    const scale = window.devicePixelRatio * this.style.scale * this.settings.scale;
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  start() {
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this.draw.bind(this));
    }
  }

  stop() {
    this.running = false;
  }

  draw() {
    // update data from call back before drawing
    this.data = this.cb();

    const scale = window.devicePixelRatio * this.style.scale * this.settings.scale;

    if (
      // size
      this.size.width * this.style.scale == this.canvas.clientWidth &&
      this.size.height * this.style.scale == this.canvas.clientHeight &&
      // scale
      Math.floor(this.canvas.clientHeight * window.devicePixelRatio * this.settings.scale) ==
        this.canvas.height
    ) {
      // no size and scale changes

      // clear canvas
      this.ctx.clearRect(0, 0, this.size.width, this.size.height); // faster?
    } else {
      // size changed

      // set virtual size(res)
      this.size = {
        width: this.canvas.clientWidth / this.style.scale,
        height: this.canvas.clientHeight / this.style.scale,
      };

      // clear and set real size(res)
      this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio * this.settings.scale;
      this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio * this.settings.scale;

      // scale
      this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    }

    if (!this.running) {
      return;
    }

    this.ctx.shadowOffsetX = this.style.shadow.offset;
    this.ctx.shadowOffsetY = this.style.shadow.offset;
    this.ctx.shadowColor = this.style.shadow.color;
    this.ctx.shadowBlur = this.style.shadow.blur;

    // set the attributes
    this.ctx.lineWidth = this.style.lineWidth;
    this.ctx.strokeStyle = this.style.color;
    this.ctx.fillStyle = this.style.color;

    // dynamic ui

    // center coordinate
    this.ctx.translate(this.size.width / 2, this.size.height / 2);

    // flight path
    this.drawFlightPath(
      this.data.flight.heading * this.settings._pixelPerRad,
      -(this.data.flight.pitch * this.settings._pixelPerRad),
    );

    this.drawProximity();

    // pitch

    if (this.settings.uncagedMode) {
      // align pitch ladders to flight path
      this.ctx.translate(
        this.settings._pixelPerRad *
          (this.data.flight.heading - this.data.flight.pitch * Math.tan(this.data.roll)),
        0,
      );
    }

    // ladders
    this.ctx.rotate(this.data.roll); // ladders roll transformation
    this.ctx.translate(0, this.data.pitch * this.settings._pixelPerRad); // ladders pitch transformation

    this.drawHorizonLadder(0, 0); // artificial horizon ladder

    const pitchDegStep = 10;

    // top ladders
    for (let deg = pitchDegStep; deg <= 90; deg += pitchDegStep) {
      this.drawPitchLadder(0, -(deg * this.settings._pixelPerDeg), deg);
    }

    // bottom ladders
    for (let deg = -pitchDegStep; deg >= -90; deg -= pitchDegStep) {
      this.drawPitchLadder(0, -(deg * this.settings._pixelPerDeg), deg);
    }

    this.ctx.setTransform(scale, 0, 0, scale, 0, 0); // reset transformation

    // fixed ui

    const border = 16;

    // speed
    // this.drawVerticalScale(border, this.size.height / 2, this.data.speed, '9999', 41, false);

    // distance (Lidar)
    this.drawVerticalScale(
      this.size.width - border,
      this.size.height / 2,
      this.data.distance,
      'xxx',
      41,
      true,
    );

    // heading
    this.drawHeading(this.size.width / 2, border, 61, false);

    // roll
    this.drawRoll(this.size.width / 2, this.size.height - border, 51, 260, true);

    // others

    // hard coded from drawVerticalScale()
    const yDif = 20 * this.style.font.scale + 4;

    // info 1
    this.drawInfo1(this.size.width - border, this.size.height / 2 + yDif);

    // "throttle"
    const leftX = border,
      rightX = border * 4;
    const yOffset = 60;
    const centerY = this.size.height / 2,
      topY = centerY - yOffset,
      bottomY = centerY + yOffset;
    const [speedFL, speedFR, speedCL, speedCR, speedRL, speedRR] = this.data.throttle;
    const [angleFL, angleFR, angleCL, angleCR, angleRL, angleRR] = this.data.direction;

    this.drawMotor(leftX, topY, speedFL, angleFL);
    this.drawMotor(leftX, centerY, speedCL, angleCL);
    this.drawMotor(leftX, bottomY, speedRL, angleRL);
    this.drawMotor(rightX, topY, speedFR, angleFR, true);
    this.drawMotor(rightX, centerY, speedCR, angleCR, true);
    this.drawMotor(rightX, bottomY, speedRR, angleRR, true);

    requestAnimationFrame(this.draw.bind(this));
  }

  setFont(size: number, unit: string) {
    this.ctx.font =
      this.style.font.style +
      ' ' +
      this.style.font.variant +
      ' ' +
      this.style.font.weight +
      ' ' +
      size +
      unit +
      ' ' +
      this.style.font.family;
  }

  setFontScale(size: number, unit: string) {
    size *= this.style.font.scale;
    this.setFont(size, unit);
  }

  drawFlightPath(x: number, y: number) {
    this.ctx.translate(x, y);

    const r = 8;

    // square
    this.ctx.beginPath();
    this.ctx.moveTo(r, 0);
    this.ctx.lineTo(0, r);
    this.ctx.lineTo(-r, 0);
    this.ctx.lineTo(0, -r);
    this.ctx.closePath();

    // lines
    const line = 16;

    // right line
    this.ctx.moveTo(r, 0);
    this.ctx.lineTo(r + line, 0);

    // center top line
    this.ctx.moveTo(0, -r);
    this.ctx.lineTo(0, -r - line);

    // left line
    this.ctx.moveTo(-r, 0);
    this.ctx.lineTo(-r - line, 0);

    // bottom top line
    this.ctx.moveTo(0, r);
    this.ctx.lineTo(0, r + line);

    this.ctx.stroke();

    this.ctx.translate(-x, -y);
  }

  drawProximity() {
    this.ctx.lineWidth = this.style.lineWidth * 2;

    for (const [key, value] of Object.entries(this.data.proximity)) {
      for (let i = 0; i < value; i++) {
        this.drawProximityLine(4 - i, key as ProximitySensorPosition);
      }
    }

    this.ctx.lineWidth = this.style.lineWidth;
    this.ctx.strokeStyle = this.style.color;
  }

  drawProximityLine(index: number, position: ProximitySensorPosition) {
    this.ctx.beginPath();
    const proxPadding = 7 * index;
    const d = Math.PI / 10;
    let start, end;
    if (position === 'RR') {
      start = 0 + d;
      end = Math.PI / 2 - d;
    } else if (position === 'RL') {
      start = Math.PI / 2 + d;
      end = Math.PI - d;
    } else if (position === 'FR') {
      start = Math.PI * 1.5 + d;
      end = Math.PI * 2 - d;
    } else {
      start = Math.PI + d;
      end = Math.PI * 1.5 - d;
    }

    if (index === 1) {
      this.ctx.strokeStyle = 'red';
    } else if (index === 2) {
      this.ctx.strokeStyle = 'orange';
    } else if (index === 3) {
      this.ctx.strokeStyle = 'yellow';
    } else if (index === 4) {
      this.ctx.strokeStyle = this.style.color;
    }

    this.ctx.arc(0, 0, 8 + proxPadding, start, end);
    this.ctx.stroke();
  }

  drawHorizonLadder(x: number, y: number) {
    this.ctx.translate(x, y);

    let length = 460; // total length
    const space = 80; // space betweens
    const q = 12;

    this.ctx.beginPath();

    // right
    this.ctx.moveTo(space / 2, 0);
    this.ctx.lineTo(length / 2 - q, 0);
    this.ctx.lineTo(length / 2, q);

    // left
    this.ctx.moveTo(-space / 2, 0);
    this.ctx.lineTo(-(length / 2 - q), 0);
    this.ctx.lineTo(-length / 2, q);

    this.ctx.stroke();

    // -1, -2 and -3 degrees pitch

    this.ctx.setLineDash([6, 4]);

    length = 26;

    this.ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      this.ctx.translate(0, this.settings._pixelPerDeg);

      // right
      this.ctx.moveTo(space / 2, 0);
      this.ctx.lineTo(space / 2 + length, 0);

      // left
      this.ctx.moveTo(-space / 2, y);
      this.ctx.lineTo(-(space / 2 + length), 0);
    }
    this.ctx.stroke();

    this.ctx.setLineDash([]);
    this.ctx.translate(-x, -y - 3 * this.settings._pixelPerDeg);
  }

  drawPitchLadder(x: number, y: number, value: number) {
    this.ctx.translate(x, y);

    const length = 200; // total length
    const space = 80; // space betweens
    const q = 12;

    this.ctx.beginPath();

    // right ladder
    this.ctx.moveTo(space / 2, 0);
    this.ctx.lineTo(length / 2 - q, 0);
    this.ctx.lineTo(length / 2, value > 0 ? q : -q);

    // left ladder
    this.ctx.moveTo(-space / 2, 0);
    this.ctx.lineTo(-(length / 2 - q), 0);
    this.ctx.lineTo(-length / 2, value > 0 ? q : -q);

    this.ctx.stroke();

    this.setFontScale(16, 'px');
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    const textBorder = 4;
    const textWidth = this.ctx.measureText('-90').width;

    // right text
    this.ctx.fillText(`${value}`, length / 2 + textBorder + textWidth, value > 0 ? q / 2 : -q / 2);

    // left text
    this.ctx.fillText(`${value}`, -(length / 2 + textBorder), value > 0 ? q / 2 : -q / 2);

    this.ctx.translate(-x, -y);
  }

  drawVerticalScale(
    x: number,
    y: number,
    value: number,
    exampleValue: string,
    stepRange: number,
    right: boolean,
  ) {
    this.ctx.save();
    this.ctx.translate(x, y);

    let mf = 1;
    if (right) {
      mf = -1;
    }

    // value indicator
    let fontSize = 20 * this.style.font.scale;
    this.setFont(fontSize, 'px');

    const textSideBorder = 5;
    const textTopBorder = 4;
    const textWidth = this.ctx.measureText(exampleValue).width;

    const height = fontSize + 2 * textTopBorder;
    const length = textSideBorder * 2 + textWidth + height / 2; // total length

    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    this.ctx.beginPath();
    this.ctx.moveTo(0, -height / 2);
    this.ctx.lineTo(mf * (textSideBorder * 2 + textWidth), -height / 2);
    this.ctx.lineTo(mf * length, 0);
    this.ctx.lineTo(mf * (textSideBorder * 2 + textWidth), height / 2);
    this.ctx.lineTo(0, height / 2);
    this.ctx.closePath();
    this.ctx.stroke();

    const text = Math.round(value);
    this.ctx.fillText(`${text}`, right ? -textSideBorder : textSideBorder + textWidth, 0);

    // scale |----I----|----I----|----I----|
    fontSize = 16 * this.style.font.scale;
    this.setFont(fontSize, 'px');
    const textBorder = 3;

    const border = 4;

    const stepLength = [16, 11, 7];

    if (!right) this.ctx.textAlign = 'left';

    // space from value indicator
    this.ctx.translate(mf * (length + border), 0);

    // visible step range clip
    this.ctx.rect(
      0,
      -((stepRange * this.style.stepWidth) / 2),
      // prettier-ignore
      mf * (stepLength[0] + 2 * textBorder + this.ctx.measureText(exampleValue + '9').width), // (step + 2*textBorder + textWidth)
      stepRange * this.style.stepWidth,
    );
    this.ctx.clip();

    const stepMargin = 5; // top and bottom extra steps
    const stepZeroOffset = Math.ceil(stepRange / 2) + stepMargin; // '0' offset from bottom (35.5 -> 18, 35 -> 18)
    const stepValueOffset = Math.floor(value); // 35.5 -> 35
    const stepOffset = value - stepValueOffset; // 35.5 -> 0.5

    this.ctx.translate(0, (stepZeroOffset + stepOffset) * this.style.stepWidth); // translate to start position

    this.ctx.beginPath();
    for (let i = -stepZeroOffset + stepValueOffset; i < stepZeroOffset + stepValueOffset; i++) {
      this.ctx.moveTo(0, 0);
      switch (Math.abs(i) % 10) {
        case 0:
          this.ctx.lineTo(mf * stepLength[0], 0);

          this.ctx.fillText(`${i}`, mf * (stepLength[0] + textBorder), 0);
          break;

        case 5:
          this.ctx.lineTo(mf * stepLength[1], 0);
          break;

        default:
          this.ctx.lineTo(mf * stepLength[2], 0);
          break;
      }

      this.ctx.translate(0, -this.style.stepWidth);
    }
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawHeading(x: number, y: number, stepRange: number, bottom: boolean) {
    this.ctx.save();
    this.ctx.translate(x, y);

    let mf = 1;
    if (bottom) {
      mf = -1;
    }

    // value indicator
    const value = this.data.heading * (180 / Math.PI);

    let fontSize = 20 * this.style.font.scale;
    this.setFont(fontSize, 'px');

    const textSideBorder = 5;
    const textTopBorder = 4;
    const textWidth = this.ctx.measureText('360').width;

    const length = textSideBorder * 2 + textWidth; // total length
    const height = textTopBorder * 1.5 + fontSize + length / 4; // total height

    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    this.ctx.beginPath();
    this.ctx.moveTo(-length / 2, 0);
    this.ctx.lineTo(length / 2, 0);
    this.ctx.lineTo(length / 2, mf * (textTopBorder * 1.5 + fontSize));
    this.ctx.lineTo(0, mf * height);
    this.ctx.lineTo(-length / 2, mf * (textTopBorder * 1.5 + fontSize));
    this.ctx.closePath();
    this.ctx.stroke();

    let text = `${Math.round(value)}`;
    this.ctx.fillText(text, textWidth / 2, (mf * (2 * textTopBorder + fontSize)) / 2);

    // scale |----I----|----N----|----I----|
    fontSize = 16 * this.style.font.scale;
    this.setFont(fontSize, 'px');
    const textBorder = 2;

    const border = 4;

    const stepLength = [16, 11, 7];

    this.ctx.textAlign = 'center';

    // space from value indicator
    this.ctx.translate(0, mf * (height + border));

    // visible step range clips
    this.ctx.rect(
      (-stepRange * this.style.stepWidth) / 2,
      0,
      this.style.stepWidth * stepRange,
      mf * (stepLength[0] + 2 * textBorder + fontSize),
    );
    this.ctx.clip();

    const stepMargin = 5; // left and right extra steps
    const stepZeroOffset = Math.ceil(stepRange / 2) + stepMargin; // '0' offset from left (35.5 -> 18, 35 -> 18)
    const stepValueOffset = Math.floor(value); // 35.5 -> 35
    const stepOffset = value - stepValueOffset; // 35.5 -> 0.5

    this.ctx.translate(-(stepZeroOffset + stepOffset) * this.style.stepWidth, 0); // translate to start position

    this.ctx.beginPath();
    for (let i = -stepZeroOffset + stepValueOffset; i < stepZeroOffset + stepValueOffset; i++) {
      const posI = Math.abs(i);

      this.ctx.moveTo(0, 0);
      switch (
        posI % 10 // steps
      ) {
        case 0:
          this.ctx.lineTo(0, mf * stepLength[0]);
          break;

        case 5:
          this.ctx.lineTo(0, mf * stepLength[1]);
          break;

        default:
          this.ctx.lineTo(0, mf * stepLength[2]);
          break;
      }

      if (posI % 90 == 0 || posI % 45 == 0 || posI % 10 == 0) {
        switch (
          posI % 360 // text
        ) {
          case 0:
            text = 'N';
            break;

          case 45:
            text = 'NE';
            break;

          case 90:
            text = 'E';
            break;

          case 135:
            text = 'SE';
            break;

          case 180:
            text = 'S';
            break;

          case 225:
            text = 'SW';
            break;

          case 270:
            text = 'W';
            break;

          case 315:
            text = 'SE';
            break;

          default:
            if (i >= 0) {
              text = `${i % 360}`;
            } else {
              text = `${360 + (i % 360)}`;
            }
            break;
        }

        this.ctx.fillText(text, 0, mf * (stepLength[0] + textBorder + fontSize / 2));
      }

      this.ctx.translate(this.style.stepWidth, 0);
    }
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawRoll(x: number, y: number, stepRange: number, radius: number, bottom: boolean) {
    this.ctx.save();
    this.ctx.translate(x, y);

    let mf = 1;
    if (bottom) {
      mf = -1;
    }

    // value indicator
    const value = this.data.roll * (180 / Math.PI);

    let fontSize = 20 * this.style.font.scale;
    this.setFont(fontSize, 'px');

    const textSideBorder = 5;
    const textTopBorder = 4;
    const textWidth = this.ctx.measureText('180').width;

    const length = textSideBorder * 2 + textWidth; // total length
    const height = textTopBorder * 1.5 + fontSize + length / 4; // total height

    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    this.ctx.beginPath();
    this.ctx.moveTo(-length / 2, 0);
    this.ctx.lineTo(length / 2, 0);
    this.ctx.lineTo(length / 2, mf * (textTopBorder * 1.5 + fontSize));
    this.ctx.lineTo(0, mf * height);
    this.ctx.lineTo(-length / 2, mf * (textTopBorder * 1.5 + fontSize));
    this.ctx.closePath();
    this.ctx.stroke();

    let text = Math.round(value);
    this.ctx.fillText(`${text}`, textWidth / 2, (mf * (2 * textTopBorder + fontSize)) / 2);

    // scale | _.i---|-''I''-|---i._ |
    fontSize = 16 * this.style.font.scale;
    this.setFont(fontSize, 'px');
    const textBorder = 2;

    const border = 4;

    const stepLength = [16, 11, 7];

    this.ctx.textAlign = 'center';

    // space from value indicator
    this.ctx.translate(0, mf * (height + border));

    switch (this.settings.rollRadius) {
      case 'exact':
        radius = (this.style.stepWidth * 180) / Math.PI;
        break;

      case 'center':
        // center radius (half canvas - border - value indicator)
        radius = this.size.height / 2 - (bottom ? this.size.height - y : y) - (height + border);
        break;

      case 'none':
      default:
        break;
    }

    if (radius < 0) {
      this.ctx.restore();
      return;
    }

    this.ctx.translate(0, mf * radius); // center of rotation

    // clip
    const angle = (stepRange * this.style.stepWidth) / radius;

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.arc(
      0,
      0,
      radius,
      (bottom ? 0.5 : 1.5) * Math.PI - angle / 2,
      (bottom ? 0.5 : 1.5) * Math.PI + angle / 2,
    );
    this.ctx.closePath();
    this.ctx.clip();

    const stepMargin = 5; // left and right extra steps
    const stepZeroOffset = Math.ceil(stepRange / 2) + stepMargin; // '0' offset from left (35.5 -> 18, 35 -> 18)
    const stepValueOffset = Math.floor(value); // 35.5 -> 35
    const stepOffset = value - stepValueOffset; // 35.5 -> 0.5

    this.ctx.beginPath();
    for (let i = -stepZeroOffset + stepValueOffset; i < stepZeroOffset + stepValueOffset; i++) {
      this.ctx.rotate((mf * -(stepValueOffset - i + stepOffset) * this.style.stepWidth) / radius);
      this.ctx.translate(0, mf * -radius); // bottom of steps

      this.ctx.moveTo(0, 0);
      switch (
        Math.abs(i) % 10 // steps
      ) {
        case 0:
          this.ctx.lineTo(0, mf * stepLength[0]);

          if (i % 360 > 180 || i % 360 <= -180) {
            text = (i % 360) - Math.sign(i) * 360;
          } else {
            text = i % 360;
          }

          this.ctx.fillText(`${text}`, 0, mf * (stepLength[0] + textBorder + fontSize / 2));
          break;

        case 5:
          this.ctx.lineTo(0, mf * stepLength[1]);
          break;

        default:
          this.ctx.lineTo(0, mf * stepLength[2]);
          break;
      }

      this.ctx.translate(0, mf * radius); // center of rotation
      this.ctx.rotate((mf * (stepValueOffset - i + stepOffset) * this.style.stepWidth) / radius);
    }
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawMotor(
    x: number,
    y: number,
    motorSpeed: number,
    motorAngle: number,
    rightMotor: boolean = false,
  ) {
    this.setFontScale(12, 'px');
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const border = 8;
    const indexLength = 6;
    const range = Math.PI / 2;
    const start = rightMotor ? 0 : Math.PI;

    const radius = this.ctx.measureText('-100%').width / 2 + border;
    const angle = start + range * (motorSpeed / 100) * (rightMotor ? -1 : 1);

    const trX = x + radius + indexLength;
    const trY = y - radius - indexLength;
    this.ctx.translate(trX, trY);

    // Draw arrow line
    this.ctx.globalAlpha = 0.3;
    this.ctx.lineWidth = 6;
    const angleIndexSize = 35;
    const arrowSize = 10;
    this.ctx.strokeStyle = 'white';
    this.ctx.save();
    this.ctx.rotate(radians(motorAngle));
    this.ctx.beginPath();
    this.ctx.moveTo(0, -angleIndexSize / 2);
    this.ctx.lineTo(0, angleIndexSize / 2);

    // Draw arrow pointer
    if (motorSpeed > 0) {
      this.ctx.moveTo(0, -angleIndexSize / 2);
      this.ctx.lineTo(-arrowSize, -angleIndexSize / 2 + arrowSize);
      this.ctx.moveTo(0 - 2, -angleIndexSize / 2 - 2);
      this.ctx.lineTo(+arrowSize, -angleIndexSize / 2 + arrowSize);
    } else if (motorSpeed < 0) {
      this.ctx.moveTo(0, angleIndexSize / 2);
      this.ctx.lineTo(-arrowSize, angleIndexSize / 2 - arrowSize);
      this.ctx.moveTo(0 - 2, angleIndexSize / 2 + 2);
      this.ctx.lineTo(+arrowSize, angleIndexSize / 2 - arrowSize);
    }

    this.ctx.stroke();
    this.ctx.restore();
    this.ctx.rotate(0);
    this.ctx.strokeStyle = this.style.color;
    this.ctx.lineWidth = this.style.lineWidth;
    this.ctx.globalAlpha = 1;

    this.ctx.beginPath();
    this.ctx.rotate(0);
    this.ctx.fillText(Math.round(motorSpeed) + '%', 0, 0);

    // Half circle
    this.ctx.globalAlpha = 0.75;
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'white';
    this.ctx.arc(0, 0, radius, Math.PI / 2, 1.5 * Math.PI, rightMotor);
    this.ctx.stroke();
    this.ctx.strokeStyle = this.style.color;
    this.ctx.globalAlpha = 1;

    const throttleColor = `rgb(${Math.abs(motorSpeed / 100) * 255}, ${
      (1 - Math.abs(motorSpeed / 100)) * 255
    },${(1 - Math.abs(motorSpeed / 100)) * 150})`;

    // Throttle
    this.ctx.beginPath();
    this.ctx.strokeStyle = throttleColor;
    this.ctx.lineWidth = this.style.lineWidth * 1.5;
    if (motorSpeed) {
      const counterWise = (rightMotor && motorSpeed >= 0) || (!rightMotor && motorSpeed <= 0);
      this.ctx.arc(0, 0, radius, start, angle, counterWise);
      this.ctx.lineTo(
        (radius + indexLength) * Math.cos(angle),
        (radius + indexLength) * Math.sin(angle),
      );
    } else {
      this.ctx.moveTo(rightMotor ? radius : -radius, 0);
      this.ctx.lineTo((rightMotor ? radius : -radius) + indexLength * (rightMotor ? 1 : -1), 0);
    }
    this.ctx.stroke();
    this.ctx.lineWidth = this.style.lineWidth;
    this.ctx.strokeStyle = this.style.color;

    this.ctx.translate(-trX, -trY);
  }

  drawInfo1(x: number, y: number) {
    this.ctx.translate(x, y);

    this.setFontScale(16, 'px');
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';

    this.ctx.fillText(this.data.info1, 0, 0);

    this.ctx.translate(-x, -y);
  }
}
