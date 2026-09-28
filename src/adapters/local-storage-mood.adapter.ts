import { MoodRecord } from '../core/models';
import { MoodRepositoryPort } from '../ports/mood-repository.port';
import { createRecordFromTag, migrateRecord } from '../core/meteorology-engine';
import { Locale } from '../core/i18n';

const STORAGE_KEY = 'mood_meteorology_records_v1';

// 统一本地时区日期口径，避免 toISOString() 的 UTC 跨日偏差。
function daysAgoDate(daysAgo: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export class LocalStorageMoodAdapter implements MoodRepositoryPort {
  constructor(private readonly locale: Locale = 'zh') {}

  getAll(): MoodRecord[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return this.resetToSample();
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 旧版本可能存了中文标签/风向，这里统一迁移为稳定编码。
        return parsed.map((item: Partial<MoodRecord> & Record<string, unknown>) => migrateRecord(item));
      }
    } catch {
      // ignore
    }
    return this.resetToSample();
  }

  add(record: MoodRecord): void {
    const records = this.getAll();
    // remove existing for same date if any
    const filtered = records.filter(r => r.date !== record.date);
    filtered.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  delete(id: string): void {
    const records = this.getAll().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  resetToSample(): MoodRecord[] {
    const sampleSequence: { tag: string; intensity: number; note: string; daysAgo: number }[] = [
      { tag: 'clear_sky', intensity: 8, note: '项目顺利交付，周末在公园草坪晒太阳看书', daysAgo: 13 },
      { tag: 'gentle_breeze', intensity: 7, note: '和久违的老朋友喝咖啡，聊得很尽兴', daysAgo: 12 },
      { tag: 'cloudy_to_overcast', intensity: 5, note: '周一早会任务排得很满，平平淡淡地推进中', daysAgo: 11 },
      { tag: 'warm_humid_front', intensity: 6, note: '收到远方朋友的明信片与礼物，心里暖融融的', daysAgo: 10 },
      { tag: 'low_pressure_fog', intensity: 4, note: '下雨天有点没精神，工作效率稍显迟缓', daysAgo: 9 },
      { tag: 'scattered_anxiety', intensity: 7, note: '季度目标对齐会议，几个指标有点卡住', daysAgo: 8 },
      { tag: 'scattered_anxiety', intensity: 8, note: '晚上失眠胡思乱想，担心后续进展', daysAgo: 7 },
      { tag: 'sudden_thunderstorm', intensity: 9, note: '需求突然变更被要求大改，情绪瞬间崩溃爆发', daysAgo: 6 },
      { tag: 'warm_humid_front', intensity: 6, note: '同组成员主动分担了工作，并送了奶茶安慰', daysAgo: 5 },
      { tag: 'cloudy_to_overcast', intensity: 5, note: '调整心态，逐步把阻塞的问题拆解解决', daysAgo: 4 },
      { tag: 'gentle_breeze', intensity: 7, note: '晚风很舒服，去河边慢跑了5公里出了一身汗', daysAgo: 3 },
      { tag: 'clear_sky', intensity: 8, note: '所有模块测试通过，终于可以松一口气', daysAgo: 2 },
      { tag: 'gentle_breeze', intensity: 7, note: '睡到自然醒，给阳台的多肉植物浇水修叶', daysAgo: 1 },
      { tag: 'scattered_anxiety', intensity: 7, note: '新的一周即将到来，局部依然盘旋着对未知的轻度担忧', daysAgo: 0 }
    ];

    const records: MoodRecord[] = sampleSequence.map(item =>
      createRecordFromTag(item.tag, item.intensity, item.note, daysAgoDate(item.daysAgo), this.locale)
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return records;
  }
}
