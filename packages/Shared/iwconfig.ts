export type IWConfig = {
  Mode: string;
  Frequency: string;
  BitRate: string;
  TxPower: string;
  LinkQuality: string;
  SignalLevel: string;
};

export type IWData = Record<string, IWConfig>;
