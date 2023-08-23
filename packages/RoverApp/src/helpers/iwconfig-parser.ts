import type { IWConfig, IWData } from '@robot/shared/iwconfig.js';

export default function parseIwconfig(value: string): IWData {
  const lines = value.split('\n');
  const iwconfig: IWData = {};

  let interfacesLines: string[] = [];
  let interfaceName: string | undefined;

  for (const line of lines) {
    // It's not first interface line
    if (line.startsWith(' ')) {
      if (line.trim() !== '') {
        interfacesLines.push(line);
      }
    } else {
      // New interface
      if (lines.length > 1 && interfaceName) {
        iwconfig[interfaceName] = parseIinterface(interfacesLines);
      }
      interfaceName = line.split(' ')[0];
      interfacesLines = [];
    }
  }

  if (lines && interfaceName) {
    iwconfig[interfaceName] = parseIinterface(interfacesLines);
  }

  return iwconfig;
}

function parseIinterface(lines: string[]): IWConfig {
  const parsed = lines
    .flatMap((line) => line.split('  '))
    .filter((s) => s.trim())
    .reduce(
      (acc, s) => {
        const [key, value] = s.trim().split(/[=:]/);
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

  return {
    Mode: parsed['Mode'] ?? '',
    Frequency: parsed['Frequency'] ?? '',
    BitRate: parsed['Bit Rate'] ?? '',
    TxPower: parsed['Tx-Power'] ?? '',
    LinkQuality: parsed['Link Quality'] ?? '',
    SignalLevel: parsed['Signal level'] ?? '',
  };
}

/* iwconfig output example : 
wlan0     IEEE 802.11  ESSID:"SFR_C888"  
    Mode:Managed  Frequency:5.18 GHz  Access Point: EC:41:18:EC:C0:93   
    Bit Rate=292.5 Mb/s   Tx-Power=31 dBm   
    Retry short limit:7   RTS thr:off   Fragment thr:off
    Encryption key:off
    Power Management:on
    Link Quality=46/70  Signal level=-64 dBm  
    Rx invalid nwid:0  Rx invalid crypt:0  Rx invalid frag:0
    Tx excessive retries:0  Invalid misc:0   Missed beacon:0
wlan1     IEEE 802.11  ESSID:"SFR_C888"  
    Mode:Managed  Frequency:5.18 GHz  Access Point: EC:41:18:EC:C0:93   
    Bit Rate=292.5 Mb/s   Tx-Power=31 dBm   
    Retry short limit:7   RTS thr:off   Fragment thr:off
    Encryption key:off
    Power Management:on
    Link Quality=46/70  Signal level=-64 dBm  
    Rx invalid nwid:0  Rx invalid crypt:0  Rx invalid frag:0
    Tx excessive retries:0  Invalid misc:0   Missed beacon:0
*/
