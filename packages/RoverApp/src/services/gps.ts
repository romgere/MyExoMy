import fs from 'fs';
import Service from './-base.js';
import { gps_update_interval, sim7600e_gps_device } from '../const.js';
import { GPSEvent, IncomingSMSEvent } from '@robot/shared/events.js';

class GPSService extends Service {
  static serviceName = 'gps';

  private gpsStream = fs.createReadStream(sim7600e_gps_device, { encoding: 'utf-8' });

  private latitude: GPSEvent['latitude'] = [0, 'N'];
  private longitude: GPSEvent['longitude'] = [0, 'E'];

  private altitude: GPSEvent['altitude'] = [0, 'M'];

  private speed: number = 0;
  private heading: number = 0;

  private status: 'A' | 'V' = 'V';
  private quality: number = 0;
  private satelitesCount: number = 0;

  private _readSteamData = (data: string | Buffer) => {
    if (typeof data !== 'string' || !data.trim().length) {
      return;
    }

    const [type, ...gpsData] = this._parseData(data.trim());

    // https://www.gpsworld.com/what-exactly-is-gps-nmea-data/
    // 133237.00 4829.295935 N 00210.805437 E 1 09 0.8 76.7 M 48.0 M  *58
    if (type === '$GPGGA') {
      if (!gpsData[1] || !gpsData[3]) {
        return;
      }

      this.latitude = [this._parseCoordString(gpsData[1], 2), gpsData[2] as 'N' | 'S'];
      this.longitude = [this._parseCoordString(gpsData[3], 3), gpsData[4] as 'E' | 'W'];

      this.quality = parseInt(gpsData[5]);
      this.satelitesCount = parseInt(gpsData[6]);

      this.altitude = [parseInt(gpsData[8]), gpsData[9] as 'M' | 'F'];
    }
    // https://docs.novatel.com/OEM7/Content/Logs/GPRMC.htm
    // 141829.00 A 4829.295661 N 00210.805591 E 0.0 323.8 161025 2.1 W A V*59
    else if (type === '$GPRMC') {
      this.status = gpsData[1] as 'A' | 'V';
      if (gpsData[1] === 'A') {
        this.speed = parseInt(gpsData[6]);
        this.heading = parseInt(gpsData[7]);
      }
    }
  };

  // Parse DDMM.MMMMM / DDDMM.MMMMM string to decimal degree
  private _parseCoordString(data: string, degreeSize: number) {
    const deg = parseInt(data.substring(0, degreeSize));
    const min = parseFloat(data.substring(degreeSize));

    return deg + min / 60;
  }

  private _parseData(data: string) {
    return data.split(',');
  }

  get gpsEventData(): GPSEvent {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      altitude: this.altitude,
      speed: this.speed,
      heading: this.heading,
      status: this.status,
      quality: this.quality,
      satelitesCount: this.satelitesCount,
    };
  }

  private _sendGpsInfo = () => {
    this.emit('gps', this.gpsEventData);
  };

  private _onSms = (sms: IncomingSMSEvent) => {
    if (sms.content.toUpperCase() === 'GPS') {
      // Build humain readable string from `gpsEventData`
      const content = Object.entries(this.gpsEventData).reduce(function (acc, [key, val]) {
        acc += `${acc === '' ? '' : '\n'}${key}=${val}`;
        return acc;
      }, '');

      this.emit('sendSms', { content });
    }
  };

  async init() {
    this.gpsStream.on('data', this._readSteamData);
    setInterval(this._sendGpsInfo, gps_update_interval);

    this.on('incomingSms', this._onSms);
  }
}

export default GPSService;
