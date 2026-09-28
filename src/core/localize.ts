// 本地化投影层：把语言无关的领域数据（编码 + 数值）解析为界面可直接展示的文案。
// Localization projection: resolves language-neutral domain data
// (codes + numeric values) into display-ready strings.
import { SynopticChartData, MoodRecord, BarometricZone, MonsoonTrend, ExtremeWeatherAlert } from './models';
import {
  Locale,
  Messages,
  MESSAGES,
  getTagMeta,
  windDirLabel,
  systemLabel,
  formatCompactInt,
  formatRange,
  formatDate,
  formatShortDate
} from './i18n';

export interface MoodRecordView {
  id: string;
  date: string; // 原始 YYYY-MM-DD，供逻辑使用 / raw value for logic
  dateLabel: string;
  shortDateLabel: string;
  tagCode: MoodRecord['tag'];
  tagLabel: string;
  icon: string;
  windDesc: string;
  pressureHpa: number;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmH: number;
  pressureLabel: string;
  tempLabel: string;
  humidityLabel: string;
  windSpeedLabel: string;
  windLabel: string;
}

export interface ZoneView {
  code: string;
  name: string;
  state: string;
  pressureRangeLabel: string;
  ratioLabel: string;
  activeRatio: number;
}

export interface MonsoonView {
  vectorName: string;
  originSource: string;
  originForceLabel: string;
  flowSpeedLabel: string;
  flowSpeedKmhLabel: string;
  upcomingForecast: string;
  forecastTitle: string;
}

export interface AlertView {
  id: string;
  levelCode: string;
  levelLabel: string;
  warningLabel: string; // 等级 + “预警” / level + “Alert”
  title: string;
  type: string;
  cause: string;
  defense: string[];
  issuedLabel: string;
}

export interface SynopticChartView {
  chartId: string;
  generatedDateLabel: string;
  current: MoodRecordView;
  records: MoodRecordView[];
  averagePressureLabel: string;
  systemLabel: string;
  zones: ZoneView[];
  monsoon: MonsoonView;
  alerts: AlertView[];
  summary: string;
}

function pressureRangeLabel(zone: BarometricZone, locale: Locale): string {
  // 紧凑整数 + 语言对应的区间连接符；极地冷高压在英文界面追加低温说明。
  const range = formatRange(zone.pressureMin, zone.pressureMax, locale, 'hPa');
  return zone.cold && locale === 'en' ? `${range} (low temperature)` : range;
}

function localizeZone(zone: BarometricZone, t: Messages, locale: Locale): ZoneView {
  // 回退到中文词条，保证缺失翻译时不出现空白。
  const strings = t.zones.items[zone.code] ?? MESSAGES.zh.zones.items[zone.code];
  return {
    code: zone.code,
    name: strings?.name ?? zone.code,
    state: strings?.state ?? '',
    pressureRangeLabel: pressureRangeLabel(zone, locale),
    ratioLabel: t.zones.frequency(zone.activeRatio),
    activeRatio: zone.activeRatio
  };
}

function localizeMonsoon(monsoon: MonsoonTrend, t: Messages, locale: Locale): MonsoonView {
  const strings = t.monsoon.items[monsoon.code] ?? MESSAGES.zh.monsoon.items[monsoon.code];
  return {
    vectorName: strings?.vectorName ?? monsoon.code,
    originSource: strings?.originSource ?? '',
    originForceLabel: t.monsoon.originForce,
    flowSpeedLabel: t.monsoon.flowSpeed,
    flowSpeedKmhLabel: `${formatCompactInt(monsoon.flowSpeedKmh, locale)} km/h`,
    upcomingForecast: strings?.upcomingForecast ?? '',
    forecastTitle: t.monsoon.forecastTitle
  };
}

function localizeAlert(alert: ExtremeWeatherAlert, t: Messages, locale: Locale): AlertView {
  const strings = t.alerts.items[alert.code] ?? MESSAGES.zh.alerts.items[alert.code];
  const levelLabel = t.alerts.levels[alert.level] ?? MESSAGES.zh.alerts.levels[alert.level] ?? alert.level;
  return {
    id: alert.id,
    levelCode: alert.level,
    levelLabel,
    warningLabel: `${levelLabel}${t.alerts.warningSuffix}`,
    title: strings?.title ?? alert.code,
    type: strings?.type ?? '',
    cause:
      strings?.cause({
        pressure: formatCompactInt(alert.params.pressure, locale),
        humidity: formatCompactInt(alert.params.humidity, locale),
        temperature: formatCompactInt(alert.params.temperature, locale)
      }) ?? '',
    defense: strings?.defense ?? [],
    issuedLabel: t.alerts.issuedAt(formatDate(alert.issuedTime, locale))
  };
}

export function localizeRecord(record: MoodRecord, locale: Locale): MoodRecordView {
  const meta = getTagMeta(record.tag, locale);
  return {
    id: record.id,
    date: record.date,
    dateLabel: formatDate(record.date, locale),
    shortDateLabel: formatShortDate(record.date, locale),
    tagCode: record.tag,
    tagLabel: meta.label,
    icon: meta.icon,
    windDesc: meta.windDesc,
    pressureHpa: record.pressureHpa,
    temperatureC: record.temperatureC,
    humidityPercent: record.humidityPercent,
    windSpeedKmH: record.windSpeedKmH,
    pressureLabel: `${formatCompactInt(record.pressureHpa, locale)} hPa`,
    tempLabel: `${formatCompactInt(record.temperatureC, locale)} °C`,
    humidityLabel: `${formatCompactInt(record.humidityPercent, locale)}%`,
    windSpeedLabel: `${formatCompactInt(record.windSpeedKmH, locale)} km/h`,
    windLabel: `${windDirLabel(record.windDirection, locale)}${MESSAGES[locale].pressure.windSuffix}`
  };
}

export function localizeChart(chart: SynopticChartData, locale: Locale): SynopticChartView {
  const t = MESSAGES[locale];
  const current = localizeRecord(chart.currentRecord, locale);
  const records = chart.records.map(r => localizeRecord(r, locale));
  const zones = chart.zones.map(z => localizeZone(z, t, locale));
  const monsoon = localizeMonsoon(chart.monsoon, t, locale);
  const alerts = chart.alerts.map(a => localizeAlert(a, t, locale));
  const sysLabel = systemLabel(chart.pressureSystemType, locale);

  // 与引擎 metSummary 同口径，所有数字经统一格式化器输出。
  const countLabel = formatCompactInt(alerts.length, locale);
  const avgLabel = formatCompactInt(chart.averagePressure, locale);
  const alertTail =
    alerts.length > 0
      ? locale === 'zh'
        ? `当前挂起 ${countLabel} 个灾害性气象预警！`
        : `${countLabel} active severe-weather alert(s).`
      : locale === 'zh'
        ? '整层大气环流平稳，无破坏性对流。'
        : 'Atmospheric circulation is stable with no destructive convection.';
  const lead =
    locale === 'zh'
      ? `气象综观显示：当前心境领空受【${sysLabel}】统御。全周期平均气压 ${avgLabel} hPa，近期主要受【${monsoon.vectorName}】影响。`
      : `Synopsis: the mind’s airspace is governed by [${sysLabel}]. Period-average pressure: ${avgLabel} hPa; recently dominated by [${monsoon.vectorName}].`;

  return {
    chartId: chart.chartId,
    generatedDateLabel: formatDate(chart.generatedDate, locale),
    current,
    records,
    averagePressureLabel: `${avgLabel} hPa`,
    systemLabel: sysLabel,
    zones,
    monsoon,
    alerts,
    summary: `${lead}${alertTail}`
  };
}
