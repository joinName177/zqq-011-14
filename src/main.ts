import './ui/styles.css';
import { LocalStorageMoodAdapter } from './adapters/local-storage-mood.adapter';
import { MeteorologyEngineAdapter } from './adapters/meteorology-engine.adapter';
import { createRecordFromTag } from './core/meteorology-engine';
import { MoodRecord, SynopticChartData } from './core/models';
import { renderWeatherApp } from './ui/app';
import { summarizeMood } from './core/mood-summary';
import { moodTelemetry } from './adapters/mood-telemetry';
import { buildBugSurface } from './adapters/quality/bugSurface';
import { createI18n, loadInitialLocale, persistLocale, localizedMonsoon, localizedSystem, type I18n } from './core/i18n';
import { toLocalISODate } from './core/time';

const repo = new LocalStorageMoodAdapter();
const metEngine = new MeteorologyEngineAdapter();

let records = repo.getAll();
let chartData: SynopticChartData = metEngine.generateSynopticChart(records);

let isModalOpen = false;
let selectedTag = '阴转多云';
let selectedIntensity = 5;
let noteText = '';
let i18n: I18n = createI18n(loadInitialLocale());

const rootEl = document.getElementById('app')!;

/** Apply locale to the document shell (language + tab title). */
function applyDocumentLocale() {
  document.documentElement.lang = i18n.locale === 'zh' ? 'zh-CN' : 'en';
  document.title = i18n.t('title');
}
applyDocumentLocale();

/** Build the localized diagnostic dataset (no raw canonical Chinese leaks). */
function writeMoodDataset() {
  const bugSurface = buildBugSurface([records.length, chartData.zones.length]);
  const summary = summarizeMood(records);
  const monsoon = localizedMonsoon(i18n, chartData.monsoon.monsoonKey);
  const system = localizedSystem(i18n, chartData.pressureSystemKey);
  const tail =
    chartData.alerts.length > 0
      ? i18n.t('summaryTailAlerts', { count: chartData.alerts.length })
      : i18n.t('summaryTailCalm');
  rootEl.dataset.moodSummary = JSON.stringify({
    summary: {
      ...summary,
      tags: summary.tags.map(tag => i18n.tagLabel(tag)),
      dominant: summary.dominant === '暂无' ? i18n.t('dominantNone') : i18n.tagLabel(summary.dominant)
    },
    chart: `${i18n.tagLabel(chartData.currentRecord.tag)} · ${i18n.t('zoneCount', { count: chartData.zones.length })}`,
    metSummary: i18n.t('summary', {
      system,
      monsoon: monsoon.vectorName,
      pressure: i18n.formatNumber(chartData.averagePressure),
      tail
    }),
    telemetry: moodTelemetry('initial'),
    bugSurface,
    preembeddedBugCount: bugSurface.bugs.length,
    hellBugCount: bugSurface.bugs.filter((bug) => bug.level === 'hell').length,
    difficultBugCount: bugSurface.bugs.filter((bug) => bug.level === 'difficult').length
  });
}

function refreshView() {
  writeMoodDataset();
  renderWeatherApp(
    rootEl,
    chartData,
    isModalOpen,
    selectedTag,
    selectedIntensity,
    noteText,
    {
      onOpenLogModal: () => {
        isModalOpen = true;
        selectedTag = '阴转多云';
        selectedIntensity = 5;
        noteText = '';
        refreshView();
      },
      onResetData: () => {
        records = repo.resetToSample();
        chartData = metEngine.generateSynopticChart(records);
        refreshView();
      },
      onToggleLocale: () => {
        i18n = createI18n(i18n.locale === 'zh' ? 'en' : 'zh');
        persistLocale(i18n.locale);
        applyDocumentLocale();
        refreshView();
      },
      onSubmitLog: (tag: string, intensity: number, note: string) => {
        const todayStr = toLocalISODate(new Date());
        const newRecord = createRecordFromTag(tag, intensity, note, todayStr);
        repo.add(newRecord);
        records = repo.getAll();
        chartData = metEngine.generateSynopticChart(records);
        isModalOpen = false;
        refreshView();
      },
      onSelectRecord: (record: MoodRecord) => {
        // Re-generate chart focusing on this record
        const filtered = records.filter(r => r.date <= record.date);
        chartData = metEngine.generateSynopticChart(filtered.length > 0 ? filtered : records);
        chartData.currentRecord = record;
        refreshView();
      }
    },
    () => {
      isModalOpen = false;
      refreshView();
    },
    (tag: string) => {
      selectedTag = tag;
      refreshView();
    },
    (intensity: number) => {
      selectedIntensity = intensity;
      refreshView();
    },
    (note: string) => {
      noteText = note;
    },
    i18n
  );
}

// Initial mount
refreshView();
