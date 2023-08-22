// https://github.com/SB3NDER/simple-hud
type HUDData = {
  pitch: number;
  roll: number;
  heading: number;
  flight: {
    pitch: number;
    heading: number;
  };
  speed: number;
  altitude: number;
  throtle: number;
};

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
    lineWidth: number;
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

  uncagedMode: boolean = false; // align pitch ladders to flight path
  rollRadius: 'none' | 'exact' | 'center' = 'none'; // 'none' / 'exact' / 'center'
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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = this.canvas.getContext('2d');

    if (!ctx) {
      throw 'Error getting canvas 2D context';
    }

    this.ctx = ctx;

    this.running = false;

    this.data = {
      pitch: 0,
      roll: 0,
      heading: 0,
      flight: {
        pitch: 0,
        heading: 0,
      },
      speed: 0,
      altitude: 0,
      throtle: 0,
    };

    this.settings = new Settings();

    // set both the degree and radiant variant
    this.settings.pixelPerDeg = 12;

    this.style = {
      lineWidth: 2,
      color: 'rgba(0, 255, 127, 1)',
      font: {
        style: 'normal',
        variant: 'normal',
        weight: 'bold',
        family: 'Arial',
        scale: 1,
      },
      hasShadow: true,
      shadow: {
        lineWidth: 2.5,
        color: 'rgba(0, 0, 0, 0.6)',
        offset: 1.8,
      },
      scale: 1, // ui scale
      stepWidth: 8,
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

    // set the attributes
    this.ctx.lineWidth = this.style.lineWidth;
    this.ctx.strokeStyle = this.style.color;
    this.ctx.fillStyle = this.style.color;

    // dynamic ui

    // center coordinate
    this.ctx.translate(this.size.width / 2, this.size.height / 2);

    // flight path
    this.drawWithShadow(() => {
      this.drawFlightPath(
        this.data.flight.heading * this.settings._pixelPerRad,
        -(this.data.flight.pitch * this.settings._pixelPerRad),
      );
    });

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
    this.drawWithShadow(() => {
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
    });

    this.ctx.setTransform(scale, 0, 0, scale, 0, 0); // reset trasformation

    // fixed ui

    const border = 16;

    // speed
    this.drawWithShadow(() => {
      this.drawVerticalScale(border, this.size.height / 2, this.data.speed, '9999', 41, false);
    });

    // altitude
    this.drawWithShadow(() => {
      this.drawVerticalScale(
        this.size.width - border,
        this.size.height / 2,
        this.data.altitude,
        '99999',
        41,
        true,
      );
    });

    // heading
    this.drawWithShadow(() => {
      this.drawHeading(this.size.width / 2, border, 61, false);
    });

    // roll
    this.drawWithShadow(() => {
      this.drawRoll(this.size.width / 2, this.size.height - border, 51, 260, true);
    });

    // others
    this.drawWithShadow(() => {
      // hard coded from drawVerticalScale()
      const yDif = 20 * this.style.font.scale + 4;

      // throtle
      this.drawThrotle(border, this.size.height / 2 - yDif);

      // time
      this.drawTime(border, this.size.height / 2 + yDif);
    });

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

  drawWithShadow(drawCall: () => void) {
    if (this.style.hasShadow) {
      this.ctx.save();

      // set attributes
      this.ctx.lineWidth = this.style.shadow.lineWidth;
      this.ctx.strokeStyle = this.style.shadow.color;
      this.ctx.fillStyle = this.style.shadow.color;

      this.ctx.translate(this.style.shadow.offset, this.style.shadow.offset);
      drawCall();

      this.ctx.restore();
    }

    drawCall();
  }

  drawFlightPath(x: number, y: number) {
    this.ctx.translate(x, y);

    const r = 12;

    // square
    this.ctx.beginPath();
    this.ctx.moveTo(r, 0);
    this.ctx.lineTo(0, r);
    this.ctx.lineTo(-r, 0);
    this.ctx.lineTo(0, -r);
    this.ctx.closePath();

    // lines
    const line = 9;

    // right line
    this.ctx.moveTo(r, 0);
    this.ctx.lineTo(r + line, 0);

    // center top line
    this.ctx.moveTo(0, -r);
    this.ctx.lineTo(0, -r - line);

    // left line
    this.ctx.moveTo(-r, 0);
    this.ctx.lineTo(-r - line, 0);

    this.ctx.stroke();

    this.ctx.translate(-x, -y);
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

  drawThrotle(x: number, y: number) {
    this.setFontScale(16, 'px');
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const border = 8;
    const indexLenght = 6;
    const range = 1.5 * Math.PI;
    const start = 0.5 * Math.PI;

    const radius = this.ctx.measureText('100%').width / 2 + border;
    const angle = start + range * this.data.throtle;

    const trX = x + radius + indexLenght;
    const trY = y - radius - indexLenght;
    this.ctx.translate(trX, trY);

    this.ctx.fillText(Math.round(this.data.throtle * 100) + '%', 0, 0);

    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, start, angle);
    this.ctx.lineTo(
      (radius + indexLenght) * Math.cos(angle),
      (radius + indexLenght) * Math.sin(angle),
    );
    this.ctx.stroke();

    this.ctx.globalAlpha = 0.5;

    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, angle, start + range);
    this.ctx.stroke();

    this.ctx.globalAlpha = 1;

    this.ctx.translate(-trX, -trY);
  }

  drawTime(x: number, y: number) {
    this.ctx.translate(x, y);

    this.setFontScale(16, 'px');
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    const now = new Date();

    this.ctx.fillText(
      now.toLocaleTimeString(undefined, {
        timeZone: this.settings.timezone,
        hour12: false,
        hourCycle: 'h23',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      0,
      0,
    );

    this.ctx.translate(-x, -y);
  }
}
