import './ui/styles.css';
import { LocalStorageMoodAdapter } from './adapters/local-storage-mood.adapter';
import { MeteorologyEngineAdapter } from './adapters/meteorology-engine.adapter';
import { createRecordFromTag } from './core/meteorology-engine';
import { MoodRecord, SynopticChartData } from './core/models';
import { renderWeatherApp } from './ui/app';
import { summarizeMood, chartSummary } from './core/mood-summary';
import { moodTelemetry } from './adapters/mood-telemetry';
import { buildBugSurface } from './adapters/quality/bugSurface';
import { localizeChart } from './core/localize';
import { Locale, getInitialLocale, persistLocale, otherLocale, todayDateString, MESSAGES } from './core/i18n';

let locale: Locale = getInitialLocale();
const repo = new LocalStorageMoodAdapter(locale);
const metEngine = new MeteorologyEngineAdapter();

let records = repo.getAll();
let chartData: SynopticChartData = metEngine.generateSynopticChart(records, locale);

let isModalOpen = false;
let selectedTag = 'cloudy_to_overcast';
let selectedIntensity = 5;
let noteText = '';

const rootEl = document.getElementById('app')!;
const bugSurface = buildBugSurface([records.length, chartData.zones.length]);
rootEl.dataset.moodSummary = JSON.stringify({
  summary: summarizeMood(records, locale),
  chart: chartSummary(chartData, locale),
  telemetry: moodTelemetry('initial'),
  bugSurface,
  preembeddedBugCount: bugSurface.bugs.length,
  hellBugCount: bugSurface.bugs.filter(bug => bug.level === 'hell').length,
  difficultBugCount: bugSurface.bugs.filter(bug => bug.level === 'difficult').length
});

function syncDocumentLocale() {
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  document.title = MESSAGES[locale].app.title;
}

function refreshView() {
  syncDocumentLocale();
  const view = localizeChart(chartData, locale);
  renderWeatherApp(
    rootEl,
    chartData,
    view,
    locale,
    isModalOpen,
    selectedTag,
    selectedIntensity,
    noteText,
    {
      onOpenLogModal: () => {
        isModalOpen = true;
        selectedTag = 'cloudy_to_overcast';
        selectedIntensity = 5;
        noteText = '';
        refreshView();
      },
      onResetData: () => {
        records = repo.resetToSample();
        chartData = metEngine.generateSynopticChart(records, locale);
        refreshView();
      },
      onSubmitLog: (tag: string, intensity: number, note: string) => {
        const newRecord = createRecordFromTag(tag, intensity, note, todayDateString(), locale);
        repo.add(newRecord);
        records = repo.getAll();
        chartData = metEngine.generateSynopticChart(records, locale);
        isModalOpen = false;
        refreshView();
      },
      onSelectRecord: (record: MoodRecord) => {
        // Re-generate chart focusing on this record
        const filtered = records.filter(r => r.date <= record.date);
        chartData = metEngine.generateSynopticChart(filtered.length > 0 ? filtered : records, locale);
        chartData.currentRecord = record;
        refreshView();
      },
      onToggleLocale: () => {
        locale = otherLocale(locale);
        persistLocale(locale);
        // 重新推演以便默认注记等语言相关文案随语言更新；数值只由编码决定，保持稳定。
        chartData = metEngine.generateSynopticChart(records, locale);
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
    }
  );
}

// Initial mount
refreshView();
