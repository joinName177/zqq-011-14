import { MoodRecord, SynopticChartData } from '../core/models';
import { Locale } from '../core/i18n';

export interface MeteorologyPort {
  generateSynopticChart(records: MoodRecord[], locale?: Locale): SynopticChartData;
}
