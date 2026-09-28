import type { MoodRecord, SynopticChartData } from './models';
import { Locale, MESSAGES, getTagMeta, formatNumber } from './i18n';

export interface MoodSummary {
  count: number;
  averageIntensity: number;
  tags: string[];
  dominant: string;
}

export function summarizeMood(records: readonly MoodRecord[], locale: Locale = 'zh'): MoodSummary {
  const count = records.length;
  const averageIntensity = count
    ? Math.round((records.reduce((sum, record) => sum + record.intensity, 0) / count) * 10) / 10
    : 0;
  const tags = [...new Set(records.map(record => record.tag))];
  const dominantCode = tags.sort(
    (a, b) => records.filter(record => record.tag === b).length - records.filter(record => record.tag === a).length
  )[0];
  const dominant = dominantCode ? getTagMeta(dominantCode, locale).label : MESSAGES[locale].summary.none;
  return { count, averageIntensity, tags, dominant };
}

export function chartSummary(chart: SynopticChartData, locale: Locale = 'zh'): string {
  const tagLabel = getTagMeta(chart.currentRecord.tag, locale).label;
  const count = formatNumber(chart.zones.length, locale);
  // 中文：标签 · 4 个气压带；英文：Label · 4 pressure belts
  return `${tagLabel} · ${count} ${MESSAGES[locale].summary.zoneUnit}`;
}
