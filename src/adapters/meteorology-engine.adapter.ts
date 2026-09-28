import { MoodRecord, SynopticChartData } from '../core/models';
import { evaluateSynopticSystem } from '../core/meteorology-engine';
import { MeteorologyPort } from '../ports/meteorology.port';
import { Locale } from '../core/i18n';

export class MeteorologyEngineAdapter implements MeteorologyPort {
  generateSynopticChart(records: MoodRecord[], locale: Locale = 'zh'): SynopticChartData {
    return evaluateSynopticSystem(records, locale);
  }
}
