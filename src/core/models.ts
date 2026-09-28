export type AlertLevel = '蓝色' | '黄色' | '橙色' | '红色';

export interface MoodTagMeta {
  /** Canonical localization key; `tag` is the canonical (zh) storage label. */
  key: string;
  tag: string;
  category: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
  defaultPressure: number; // 960 - 1040 hPa
  defaultTemp: number;     // Celsius
  defaultHumidity: number; // 0 - 100%
  icon: string;
  windDesc: string;
  themeColor: string;
}

export interface MoodRecord {
  id: string;
  date: string; // YYYY-MM-DD
  tag: string;
  /** Canonical localization key; absent only on legacy records. */
  tagKey?: string;
  intensity: number; // 1 - 10
  note: string;
  pressureHpa: number;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmH: number;
  windDirectionDeg: number;
  /** Canonical localization key (e.g. 'ne'); windDirectionName is the canonical (zh) fallback. */
  windDirectionKey: string;
  windDirectionName: string;
}

export interface BarometricZone {
  code: string;
  /** Canonical localization key; `name` stays as the canonical (zh) fallback. */
  zoneKey: string;
  name: string;
  psychologicalState: string;
  pressureRange: string;
  activeRatio: number; // 0 - 100%
  status: 'dominant' | 'active' | 'receding';
  description: string;
}

export interface MonsoonTrend {
  /** Canonical localization key. */
  monsoonKey: string;
  vectorName: string;
  originSource: string;
  frequencyDays: number;
  flowSpeed: string;
  windAngle: number;
  weatherImpact: string;
  upcomingForecast: string;
}

export interface ExtremeWeatherAlert {
  id: string;
  /** Canonical localization key (may be absent for unknown/legacy alerts). */
  alertKey?: string;
  level: AlertLevel;
  type: string;
  title: string;
  issuedTime: string;
  triggerCause: string;
  /** Locale-neutral metric values used to build the localized triggerCause. */
  metrics?: {
    pressureHpa?: number;
    temperatureC?: number;
    humidityPercent?: number;
  };
  defenseProtocol: string[]; // 防灾自愈指南
}

export interface SynopticChartData {
  chartId: string;
  generatedDate: string;
  currentRecord: MoodRecord;
  records: MoodRecord[];
  averagePressure: number;
  zones: BarometricZone[];
  monsoon: MonsoonTrend;
  alerts: ExtremeWeatherAlert[];
  /** Canonical localization key of the pressure system type. */
  pressureSystemKey: string;
  pressureSystemType: '强烈冷涡旋' | '副热带高压晴空' | '锋面气旋多变' | '温带反气旋平稳' | '深槽低气压阴霾';
  /** Canonical (zh) summary sentence; use i18n helpers for display. */
  metSummary: string;
}
