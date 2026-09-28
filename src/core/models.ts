import type {
  MoodTagCode,
  WindDirCode,
  ZoneCode,
  MonsoonCode,
  PressureSystemCode,
  AlertLevelCode,
  AlertCode
} from './i18n';

// 预警等级使用稳定编码（blue/yellow/orange/red），展示文案统一在 i18n 层解析。
export type AlertLevel = AlertLevelCode;

export interface MoodRecord {
  id: string;
  date: string; // YYYY-MM-DD（本地时区，跨日口径统一 / local time zone）
  tag: MoodTagCode;
  intensity: number; // 1 - 10
  note: string;
  pressureHpa: number;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmH: number;
  windDirectionDeg: number;
  windDirection: WindDirCode;
}

// 气压带仅保存编码、数值区间与统计比例，名称/描述在 i18n 层解析。
export interface BarometricZone {
  code: ZoneCode;
  pressureMin: number;
  pressureMax: number;
  cold?: boolean;
  activeRatio: number; // 0 - 100%
  status: 'dominant' | 'active' | 'receding';
}

export interface MonsoonTrend {
  code: MonsoonCode;
  frequencyDays: number;
  flowSpeedKmh: number;
  windAngle: number;
}

export interface ExtremeWeatherAlert {
  id: string;
  code: AlertCode;
  level: AlertLevel;
  issuedTime: string; // YYYY-MM-DD
  // 触发预警时的遥测数值快照，供本地化文案插值（语言无关）。
  // Telemetry snapshot used to interpolate localized copy.
  params: {
    pressure: number;
    humidity: number;
    temperature: number;
  };
}

export interface SynopticChartData {
  chartId: string;
  generatedDate: string; // YYYY-MM-DD
  currentRecord: MoodRecord;
  records: MoodRecord[];
  averagePressure: number;
  zones: BarometricZone[];
  monsoon: MonsoonTrend;
  alerts: ExtremeWeatherAlert[];
  pressureSystemType: PressureSystemCode;
}
