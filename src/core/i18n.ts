import type { AlertLevel } from './models';
import { parseISODate } from './time';

export type Locale = 'zh' | 'en';
export const SUPPORTED_LOCALES: readonly Locale[] = ['zh', 'en'];
export const DEFAULT_LOCALE: Locale = 'zh';
const LOCALE_STORAGE_KEY = 'mood_meteorology_locale_v1';

/* ------------------------------------------------------------------ */
/* Canonical keys — stable identifiers, never shown directly           */
/* ------------------------------------------------------------------ */

export const TAG_KEYS = [
  'clearSky',
  'gentleBreeze',
  'cloudyTurning',
  'lowPressureFog',
  'localizedAnxiety',
  'warmHumidFront',
  'suddenThunderstorm',
  'coldWaveGale'
] as const;
export type TagKey = (typeof TAG_KEYS)[number];

/** Map legacy/storage tag strings (Chinese labels) to canonical keys. */
export const TAG_KEY_BY_LABEL: Record<string, TagKey> = {
  晴空万里: 'clearSky',
  微风煦暖: 'gentleBreeze',
  阴转多云: 'cloudyTurning',
  低气压大雾: 'lowPressureFog',
  局部有焦虑: 'localizedAnxiety',
  暖湿气流过境: 'warmHumidFront',
  突发雷暴: 'suddenThunderstorm',
  寒潮大风: 'coldWaveGale'
};

/** Canonical storage label (zh) for a tag key; null for unknown keys. */
export function tagLabelByKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const entry = (Object.entries(TAG_KEY_BY_LABEL) as [string, TagKey][]).find(([, k]) => k === key);
  return entry ? entry[0] : null;
}

export type AlertLevelKey = 'blue' | 'yellow' | 'orange' | 'red';
export const ALERT_LEVEL_KEY_BY_LABEL: Record<AlertLevel, AlertLevelKey> = {
  蓝色: 'blue',
  黄色: 'yellow',
  橙色: 'orange',
  红色: 'red'
};

export const ZONE_KEYS = ['subtropicalHigh', 'equatorialTrough', 'subpolarLow', 'polarHigh'] as const;
export type ZoneKey = (typeof ZONE_KEYS)[number];

export const MONSOON_KEYS = ['mildSouth', 'tropicalCyclone', 'highPressureWesterly'] as const;
export type MonsoonKey = (typeof MONSOON_KEYS)[number];

export const SYSTEM_KEYS = ['coldVortex', 'subtropicalClear', 'frontalCyclone', 'temperateAnticyclone', 'deepTrough'] as const;
export type SystemKey = (typeof SYSTEM_KEYS)[number];

export const ALERT_KEYS = ['redStorm', 'orangeAnxiety', 'yellowCold'] as const;
export type AlertKey = (typeof ALERT_KEYS)[number];

/** 8 compass directions in display order (NE, E, SE, S, SW, W, NW, N). */
export const WIND_KEYS = ['ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'n'] as const;
export type WindKey = (typeof WIND_KEYS)[number];

/** Legacy records store the canonical Chinese direction name. */
export const WIND_KEY_BY_LABEL: Record<string, WindKey> = {
  东北: 'ne',
  东: 'e',
  东南: 'se',
  南: 's',
  西南: 'sw',
  西: 'w',
  西北: 'nw',
  北: 'n'
};

/* ------------------------------------------------------------------ */
/* Bundle contracts — both locales must implement every key            */
/* ------------------------------------------------------------------ */

interface TagBundle {
  label: string;
  windDesc: string;
}

interface ZoneBundle {
  name: string;
  state: string;
  description: string;
  pressureRange: string;
}

interface MonsoonBundle {
  vectorName: string;
  originSource: string;
  flowSpeed: string;
  weatherImpact: string;
  upcomingForecast: string;
}

interface AlertBundle {
  type: string;
  title: string;
  /** {value} placeholders are interpolated via t(). */
  triggerCause: string;
  defenseProtocol: readonly string[];
}

interface LocaleBundle {
  ui: Record<string, string>;
  tags: Record<TagKey, TagBundle>;
  alertLevels: Record<AlertLevelKey, string>;
  winds: Record<WindKey, string>;
  zones: Record<ZoneKey, ZoneBundle>;
  monsoons: Record<MonsoonKey, MonsoonBundle>;
  systems: Record<SystemKey, string>;
  alerts: Record<AlertKey, AlertBundle>;
  fallback: {
    text: string;
    unknownTag: string;
    unknownZone: string;
    unknownMonsoon: string;
    unknownSystem: string;
    unknownAlert: string;
  };
}

/* ------------------------------------------------------------------ */
/* Chinese (default)                                                    */
/* ------------------------------------------------------------------ */

const zhBundle: LocaleBundle = {
  ui: {
    title: '情绪天气台 · 心灵气象图系统',
    subtitle: 'PSYCHOLOGICAL METEOROLOGICAL OBSERVATORY & SYNOPTIC CHART',
    btnReset: '🔄 重置示例气象序列',
    btnRecord: '✍️ 记录今日心情天气',
    langToggle: 'EN',
    langToggleTitle: 'Switch to English',
    alertSuffix: '预警',
    alertIssuedAt: '{date} 发布',
    chartTitle: '🌐 个人专属情绪综观天气图',
    chartTitleEn: 'Synoptic Chart',
    stationPoint: '气压观测点: {value} hPa',
    telemetryPressure: '心境气压',
    telemetryPressureEn: 'Barometer',
    pressureLow: '低压对流',
    pressureHigh: '高压反气旋',
    telemetryTemp: '情绪温度',
    telemetryTempEn: 'Temperature',
    tempComfort: '体感适宜度良好',
    telemetryHumidity: '心理湿度',
    telemetryHumidityEn: 'Humidity',
    humidityWet: '湿润多云',
    humidityDry: '清爽干燥',
    telemetryWind: '思绪风场',
    telemetryWindEn: 'Wind Field',
    windDirection: '{dir}风',
    unitKmh: '{value} km/h',
    legendLow: '低压中心 (L) / 气旋雨带',
    legendHigh: '高压中心 (H) / 晴朗平稳',
    legendIsobars: '等压线 (Isobars)',
    legendWind: '风向矢量箭头',
    timelineTitle: '📅 近期气象观测序列 (点击切换观测标本)',
    zonesTitle: '🧭 情绪气压带分布',
    zoneFrequency: '{value}% 频次',
    zoneCount: '{count} 个气压带',
    dominantNone: '暂无',
    monsoonTitle: '🌬️ 季风走势与大气环流',
    monsoonOrigin: '流场源动力：{value}',
    monsoonSpeed: '流动强度：{value}',
    monsoonForecastTitle: '未来三日气象推演：',
    summary: '气象综观显示：当前心境领空受【{system}】统御。全周期平均气压 {pressure} hPa，近期主要受【{monsoon}】影响。{tail}',
    summaryTailAlerts: '当前挂起 {count} 个灾害性气象预警！',
    summaryTailCalm: '整层大气环流平稳，无破坏性对流。',
    alertsTitle: '⚠️ 极端天气预警与自愈指南',
    defenseTitle: '🛡️ 防灾避险自愈协议：',
    alertsEmpty: '✅ 当前心境空域晴朗，无活动极端灾害天气警报。',
    modalTitle: '✍️ 今日心情气象签到',
    modalChooseTag: '选择今日核心气象标签：',
    modalIntensity: '气象对流强度 (1 - 10 级)：',
    modalNote: '观测记录与心绪注记：',
    modalNotePlaceholder: '写下引起今天气压变化的事情或思绪...',
    modalCancel: '取消',
    modalSubmit: '保存并更新气象图'
  },
  tags: {
    clearSky: { label: '晴空万里', windDesc: '微风拂面 · 东南风 2级' },
    gentleBreeze: { label: '微风煦暖', windDesc: '和煦暖风 · 南风 3级' },
    cloudyTurning: { label: '阴转多云', windDesc: '静风无定向 · 气压平缓' },
    lowPressureFog: { label: '低气压大雾', windDesc: '无风凝滞 · 能见度不足' },
    localizedAnxiety: { label: '局部有焦虑', windDesc: '偏西阵风 5级 · 气旋对流' },
    warmHumidFront: { label: '暖湿气流过境', windDesc: '西南湿润气流 4级' },
    suddenThunderstorm: { label: '突发雷暴', windDesc: '强烈飑线 · 偏北强风 8级' },
    coldWaveGale: { label: '寒潮大风', windDesc: '西伯利亚干冷风 7级' }
  },
  alertLevels: { blue: '蓝色', yellow: '黄色', orange: '橙色', red: '红色' },
  winds: { ne: '东北', e: '东', se: '东南', s: '南', sw: '西南', w: '西', nw: '西北', n: '北' },
  zones: {
    subtropicalHigh: {
      name: '副热带高压带（心境晴朗稳定）',
      state: '精力平稳、秩序感充足、心态从容明朗',
      description: '受反气旋沉降气流控制，天空云量稀少，注意力聚焦，内耗极低。',
      pressureRange: '1018 ~ 1030 hPa'
    },
    equatorialTrough: {
      name: '赤道低压槽（充沛对流与灵感）',
      state: '情绪敏感、灵感涌动、轻微情绪躁动',
      description: '对流活动旺盛，情绪水汽充沛，容易产生即兴表达欲与探索热情。',
      pressureRange: '1000 ~ 1015 hPa'
    },
    subpolarLow: {
      name: '副极地低气压带（低落潮湿阻滞）',
      state: '情绪内耗、局部焦虑、精力低谷期',
      description: '暖冷气团交汇形成持久锋面雨带，情绪云层厚重，阳光穿透力减弱。',
      pressureRange: '970 ~ 998 hPa'
    },
    polarHigh: {
      name: '极地冷高压区（情感冷却与封闭）',
      state: '冷漠理性、拒绝社交、自我防御开启',
      description: '温度跌破防御线，地表热量迅速散失，表现为情绪冷淡与沉默。',
      pressureRange: '1025 ~ 1045 hPa (低温)'
    }
  },
  monsoons: {
    mildSouth: {
      vectorName: '东亚温和偏南季风',
      originSource: '来自生活日常与适度社交温和气团',
      flowSpeed: '微风 12 km/h',
      weatherImpact: '气压平衡，情绪系统处于舒适自净区间',
      upcomingForecast: '预计未来三天无明显冷空气入侵，维持多云转晴趋势。'
    },
    tropicalCyclone: {
      vectorName: '西南热带气旋逆时针切变流',
      originSource: '来自多重待办任务与社交过载的深层热低压',
      flowSpeed: '疾风 48 km/h',
      weatherImpact: '带来间歇性焦虑降水与情绪飑线，心理湿度高居不下',
      upcomingForecast: '警惕情绪二次对流反弹，建议尽早启动防灾避雨防御。'
    },
    highPressureWesterly: {
      vectorName: '高压脊平直西风气流',
      originSource: '来自坚实生活秩序与专注工作带来的稳定反气旋',
      flowSpeed: '清风 18 km/h',
      weatherImpact: '视界清晰无云，情绪能见度极高，适合规划长期战略',
      upcomingForecast: '高压系统稳定，气温宜人，建议保持当前生活节律。'
    }
  },
  systems: {
    coldVortex: '强烈冷涡旋',
    subtropicalClear: '副热带高压晴空',
    frontalCyclone: '锋面气旋多变',
    temperateAnticyclone: '温带反气旋平稳',
    deepTrough: '深槽低气压阴霾'
  },
  alerts: {
    redStorm: {
      type: '情绪特大暴雨与雷电暴风预警',
      title: '红色暴雨预警 · 情绪超负荷对流',
      triggerCause: '中心气压降至 {pressure} hPa，阵风超速，局部心理降水量达特大暴雨级别。',
      defenseProtocol: [
        '立即暂停所有高摩擦高风险的人际沟通与决策。',
        '退回物理安全区（卧室/安静角落），拉上窗帘切断过多声光刺激。',
        '进行5次深长腹式呼吸，允许眼泪或倾诉作为自然水汽释放。',
        '备用应急热饮（热牛奶或洋甘菊茶），等待气旋中心移出。'
      ]
    },
    orangeAnxiety: {
      type: '干热高温与强对流焦虑预警',
      title: '橙色预警 · 局部焦虑气团盘旋',
      triggerCause: '心理湿度高达 {humidity}%，内热积蓄，出现明显心率过载与思绪乱流。',
      defenseProtocol: [
        '执行“注意力物理降温”：离开发生焦虑的工位，步行洗脸或冷水洗手。',
        '将脑中盘旋的所有待办事项写在纸上，关停后台大脑线程。',
        '禁止在当夜进行自我复盘或批判，推迟至明早高压回升后再议。'
      ]
    },
    yellowCold: {
      type: '情感寒潮与社交冰封预警',
      title: '黄色预警 · 极地干冷冷锋压境',
      triggerCause: '气温剧烈骤降至 {temperature} °C，情绪能量趋近冰点，防御性坚冰形成。',
      defenseProtocol: [
        '不必强迫自己热情回应外界信息，开启社交请假条/免打扰模式。',
        '通过热汤、暖水袋、厚毯子提供基础躯体热量。',
        '倾听白噪音或重温一部熟悉的童年治愈老电影。'
      ]
    }
  },
  fallback: {
    text: '—',
    unknownTag: '未知天气标签',
    unknownZone: '未知气压带',
    unknownMonsoon: '未知季风流场',
    unknownSystem: '未知天气系统',
    unknownAlert: '未知气象预警'
  }
};

/* ------------------------------------------------------------------ */
/* English                                                              */
/* ------------------------------------------------------------------ */

const enBundle: LocaleBundle = {
  ui: {
    title: 'Mood Weather Station · Synoptic Chart of the Mind',
    subtitle: 'PSYCHOLOGICAL METEOROLOGICAL OBSERVATORY & SYNOPTIC CHART',
    btnReset: '🔄 Reset Sample Sequence',
    btnRecord: '✍️ Log Today’s Mood Weather',
    langToggle: '中文',
    langToggleTitle: '切换为中文',
    alertSuffix: ' Alert',
    alertIssuedAt: 'Issued {date}',
    chartTitle: '🌐 Personal Synoptic Mood Chart',
    chartTitleEn: 'Synoptic Chart',
    stationPoint: 'Pressure Station: {value} hPa',
    telemetryPressure: 'Mind Barometer',
    telemetryPressureEn: 'Barometer',
    pressureLow: 'Low-Pressure Convection',
    pressureHigh: 'High-Pressure Anticyclone',
    telemetryTemp: 'Emotional Temperature',
    telemetryTempEn: 'Temperature',
    tempComfort: 'Comfortable perceived range',
    telemetryHumidity: 'Psychic Humidity',
    telemetryHumidityEn: 'Humidity',
    humidityWet: 'Humid & Overcast',
    humidityDry: 'Fresh & Dry',
    telemetryWind: 'Thought Wind Field',
    telemetryWindEn: 'Wind Field',
    windDirection: '{dir} Wind',
    unitKmh: '{value} km/h',
    legendLow: 'Low-Pressure Center (L) / Cyclonic Rain Band',
    legendHigh: 'High-Pressure Center (H) / Calm & Clear',
    legendIsobars: 'Isobars',
    legendWind: 'Wind Vector Arrows',
    timelineTitle: '📅 Recent Observations (click to focus a specimen)',
    zonesTitle: '🧭 Barometric Pressure Zones',
    zoneFrequency: '{value}% frequency',
    zoneCount: '{count} pressure zones',
    dominantNone: 'None',
    monsoonTitle: '🌬️ Monsoon Trends & Atmospheric Circulation',
    monsoonOrigin: 'Source dynamics: {value}',
    monsoonSpeed: 'Flow speed: {value}',
    monsoonForecastTitle: '3-Day Outlook:',
    summary: 'Synopsis: the mind airspace is governed by [{system}]. Period-average pressure is {pressure} hPa, recently influenced by [{monsoon}]. {tail}',
    summaryTailAlerts: '{count} active severe weather alert(s)!',
    summaryTailCalm: 'Circulation is stable throughout, with no disruptive convection.',
    alertsTitle: '⚠️ Extreme Weather Alerts & Self-Care Guide',
    defenseTitle: '🛡️ Shelter & Self-Healing Protocol:',
    alertsEmpty: '✅ Mind airspace is clear. No active extreme weather alerts.',
    modalTitle: '✍️ Today’s Mood Weather Check-In',
    modalChooseTag: 'Choose today’s core weather tag:',
    modalIntensity: 'Convection intensity (level 1 - 10):',
    modalNote: 'Observation notes:',
    modalNotePlaceholder: 'Write what moved today’s pressure...',
    modalCancel: 'Cancel',
    modalSubmit: 'Save & Update Chart'
  },
  tags: {
    clearSky: { label: 'Clear Sky', windDesc: 'Gentle breeze · SE force 2' },
    gentleBreeze: { label: 'Warm Breeze', windDesc: 'Warm southerly · force 3' },
    cloudyTurning: { label: 'Overcast to Partly Cloudy', windDesc: 'Calm, variable wind · steady pressure' },
    lowPressureFog: { label: 'Low-Pressure Fog', windDesc: 'Still air · poor visibility' },
    localizedAnxiety: { label: 'Scattered Anxiety', windDesc: 'Westerly gusts force 5 · cyclonic convection' },
    warmHumidFront: { label: 'Warm-Humid Front Passing', windDesc: 'Moist SW flow · force 4' },
    suddenThunderstorm: { label: 'Sudden Thunderstorm', windDesc: 'Squall line · strong northerly force 8' },
    coldWaveGale: { label: 'Cold-Wave Gale', windDesc: 'Dry Siberian wind · force 7' }
  },
  alertLevels: { blue: 'Blue', yellow: 'Yellow', orange: 'Orange', red: 'Red' },
  winds: { ne: 'NE', e: 'E', se: 'SE', s: 'S', sw: 'SW', w: 'W', nw: 'NW', n: 'N' },
  zones: {
    subtropicalHigh: {
      name: 'Subtropical High Belt (Clear & Stable)',
      state: 'Steady energy, strong sense of order, calm and bright',
      description: 'Under subsiding anticyclonic flow, cloud cover is sparse, focus sharp, internal friction minimal.',
      pressureRange: '1018–1030 hPa'
    },
    equatorialTrough: {
      name: 'Equatorial Low-Pressure Trough (Convection & Inspiration)',
      state: 'Emotionally sensitive, inspired, gently restless',
      description: 'Active convection with ample emotional moisture fuels spontaneous expression and curiosity.',
      pressureRange: '1000–1015 hPa'
    },
    subpolarLow: {
      name: 'Subpolar Low-Pressure Belt (Low, Damp & Blocked)',
      state: 'Mental friction, scattered anxiety, low-energy period',
      description: 'Colliding air masses form a persistent frontal rain band; emotional cloud cover is thick.',
      pressureRange: '970–998 hPa'
    },
    polarHigh: {
      name: 'Polar Cold High (Emotional Cooling & Withdrawal)',
      state: 'Detached rationality, social withdrawal, defenses up',
      description: 'Temperatures fall below the defensive line as warmth dissipates — emotional coldness and silence.',
      pressureRange: '1025–1045 hPa (cold)'
    }
  },
  monsoons: {
    mildSouth: {
      vectorName: 'Mild Southerly East Asian Monsoon',
      originSource: 'Gentle air mass from daily life and moderate social contact',
      flowSpeed: 'Light breeze · 12 km/h',
      weatherImpact: 'Balanced pressure; the emotional system sits in a comfortable self-cleansing range.',
      upcomingForecast: 'No cold-air intrusion expected over the next three days; partly cloudy turning clear.'
    },
    tropicalCyclone: {
      vectorName: 'SW Tropical Cyclone Counter-Clockwise Shear',
      originSource: 'Deep thermal low from task overload and social saturation',
      flowSpeed: 'Strong wind · 48 km/h',
      weatherImpact: 'Intermittent anxiety showers and emotional squalls; psychic humidity stays high.',
      upcomingForecast: 'Watch for a second round of convective rebound; activate shelter protocols early.'
    },
    highPressureWesterly: {
      vectorName: 'Straight Westerly Flow Along the High-Pressure Ridge',
      originSource: 'Stable anticyclone from solid routines and focused work',
      flowSpeed: 'Fresh breeze · 18 km/h',
      weatherImpact: 'Clear horizons and maximum emotional visibility — ideal for long-term planning.',
      upcomingForecast: 'The high remains stable with pleasant temperatures; keep the current rhythm.'
    }
  },
  systems: {
    coldVortex: 'Intense Cold Vortex',
    subtropicalClear: 'Subtropical High, Clear Sky',
    frontalCyclone: 'Variable Frontal Cyclone',
    temperateAnticyclone: 'Temperate Anticyclone, Stable',
    deepTrough: 'Deep Low-Pressure Trough, Gloomy'
  },
  alerts: {
    redStorm: {
      type: 'Severe Emotional Rainstorm & Thunder-Gale Warning',
      title: 'Red Rainstorm Warning · Emotional Overload Convection',
      triggerCause: 'Central pressure fell to {pressure} hPa with gale-force gusts; local psychic rainfall reached torrential levels.',
      defenseProtocol: [
        'Immediately pause all high-friction, high-stakes conversations and decisions.',
        'Withdraw to a physical safe space (bedroom/quiet corner); draw curtains to cut excess light and sound.',
        'Take five slow diaphragmatic breaths; allow tears or talking as natural moisture release.',
        'Keep an emergency warm drink (warm milk or chamomile tea) while the cyclone center passes.'
      ]
    },
    orangeAnxiety: {
      type: 'Dry Heat & Severe Convective Anxiety Warning',
      title: 'Orange Warning · Localized Anxiety Air Mass Hovering',
      triggerCause: 'Psychic humidity reached {humidity}%; internal heat builds with clear heart-rate overload and thought turbulence.',
      defenseProtocol: [
        'Run a “physical attention cooldown”: leave the anxiety-triggering desk; splash cold water on face and hands.',
        'Write every circling to-do onto paper and shut down the brain’s background threads.',
        'No self-review or self-criticism tonight — postpone until pressure rebuilds tomorrow morning.'
      ]
    },
    yellowCold: {
      type: 'Emotional Cold Wave & Social Freeze Warning',
      title: 'Yellow Warning · Polar Cold Front Pressing In',
      triggerCause: 'Temperature plunged to {temperature} °C; emotional energy nears freezing and defensive ice forms.',
      defenseProtocol: [
        'Do not force warm responses to messages; enable a social pass / do-not-disturb mode.',
        'Supply basic bodily warmth through hot soup, a hot-water bottle and thick blankets.',
        'Listen to white noise or rewatch a familiar childhood comfort film.'
      ]
    }
  },
  fallback: {
    text: '—',
    unknownTag: 'Unknown weather tag',
    unknownZone: 'Unknown pressure zone',
    unknownMonsoon: 'Unknown monsoon flow',
    unknownSystem: 'Unknown weather system',
    unknownAlert: 'Unknown weather alert'
  }
};

const BUNDLES: Record<Locale, LocaleBundle> = { zh: zhBundle, en: enBundle };

/* ------------------------------------------------------------------ */
/* Runtime: locale detection / persistence                             */
/* ------------------------------------------------------------------ */

export function loadInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') return stored;
  } catch {
    // localStorage unavailable — fall through to browser detection
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : '').toLowerCase();
  return nav.startsWith('zh') ? 'zh' : 'en';
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // persistence is best-effort
  }
}

export interface I18n {
  locale: Locale;
  /** UI string with `{name}` interpolation; guaranteed non-empty fallback. */
  t(key: string, params?: Record<string, string | number>): string;
  tagLabel(labelOrKey: string | undefined): string;
  alertLevel(level: AlertLevel | string | undefined): string;
  windName(key: WindKey | string | undefined): string;
  formatDate(isoDate: string | undefined, style?: 'long' | 'short'): string;
  formatNumber(value: number | null | undefined, fractionDigits?: number): string;
}

/** Replace `{name}` tokens; missing params render as the global dash. */
function interpolate(template: string, params: Record<string, string | number> | undefined, dash: string): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    params && params[name] !== undefined && params[name] !== null ? String(params[name]) : dash
  );
}

export function createI18n(locale: Locale): I18n {
  const active: Locale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const bundle = BUNDLES[active];
  const defaultBundle = BUNDLES[DEFAULT_LOCALE];
  const dash = bundle.fallback.text || '—';

  const t: I18n['t'] = (key, params) => {
    const template = bundle.ui[key] ?? defaultBundle.ui[key];
    if (template === undefined || template === '') return dash;
    return interpolate(template, params, dash);
  };

  const tagLabel: I18n['tagLabel'] = labelOrKey => {
    if (!labelOrKey) return bundle.fallback.unknownTag;
    const key = (TAG_KEYS.includes(labelOrKey as TagKey)
      ? (labelOrKey as TagKey)
      : TAG_KEY_BY_LABEL[labelOrKey]) as TagKey | undefined;
    if (!key) return labelOrKey || bundle.fallback.unknownTag;
    return bundle.tags[key]?.label ?? defaultBundle.tags[key]?.label ?? bundle.fallback.unknownTag;
  };

  const alertLevel: I18n['alertLevel'] = level => {
    if (!level) return dash;
    const fromLabel = ALERT_LEVEL_KEY_BY_LABEL[level as AlertLevel];
    const key: AlertLevelKey | undefined =
      fromLabel ??
      ((['blue', 'yellow', 'orange', 'red'] as const).includes(level as AlertLevelKey)
        ? (level as AlertLevelKey)
        : undefined);
    return key ? bundle.alertLevels[key] ?? defaultBundle.alertLevels[key] ?? dash : dash;
  };

  const windName: I18n['windName'] = key => {
    if (!key) return dash;
    const k = (WIND_KEYS.includes(key as WindKey)
      ? (key as WindKey)
      : WIND_KEY_BY_LABEL[key]) as WindKey | undefined;
    return k ? bundle.winds[k] ?? defaultBundle.winds[k] ?? dash : dash;
  };

  const longDateFormat = new Intl.DateTimeFormat(active === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const shortDateFormat = new Intl.DateTimeFormat(active === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric'
  });

  const formatDate: I18n['formatDate'] = (isoDate, style = 'long') => {
    if (!isoDate) return dash;
    const parsed = parseISODate(isoDate);
    if (!parsed) return dash;
    try {
      return (style === 'short' ? shortDateFormat : longDateFormat).format(parsed);
    } catch {
      return isoDate;
    }
  };

  const numberFormat = new Intl.NumberFormat(active === 'zh' ? 'zh-CN' : 'en-US', {
    maximumFractionDigits: 1
  });

  const formatNumber: I18n['formatNumber'] = (value, fractionDigits) => {
    if (value === null || value === undefined || Number.isNaN(value)) return dash;
    try {
      if (fractionDigits !== undefined) {
        return new Intl.NumberFormat(active === 'zh' ? 'zh-CN' : 'en-US', {
          maximumFractionDigits: fractionDigits,
          minimumFractionDigits: 0
        }).format(value);
      }
      return numberFormat.format(value);
    } catch {
      return String(value);
    }
  };

  return { locale: active, t, tagLabel, alertLevel, windName, formatDate, formatNumber };
}

/* ------------------------------------------------------------------ */
/* Structured-domain lookups (zones / monsoon / alerts)                */
/* ------------------------------------------------------------------ */

export function localizedZone(i18n: I18n, key: string | undefined): ZoneBundle {
  const k = (ZONE_KEYS.includes(key as ZoneKey) ? key : undefined) as ZoneKey | undefined;
  const fallback = i18n.locale === DEFAULT_LOCALE ? null : BUNDLES[DEFAULT_LOCALE].zones[k as ZoneKey];
  return (
    (k && BUNDLES[i18n.locale].zones[k]) ||
    fallback || {
      name: BUNDLES[i18n.locale].fallback.unknownZone,
      state: BUNDLES[i18n.locale].fallback.unknownZone,
      description: BUNDLES[i18n.locale].fallback.unknownZone,
      pressureRange: BUNDLES[i18n.locale].fallback.text
    }
  );
}

export function localizedMonsoon(i18n: I18n, key: string | undefined): MonsoonBundle {
  const k = (MONSOON_KEYS.includes(key as MonsoonKey) ? key : undefined) as MonsoonKey | undefined;
  const fallback = i18n.locale === DEFAULT_LOCALE ? null : BUNDLES[DEFAULT_LOCALE].monsoons[k as MonsoonKey];
  return (
    (k && BUNDLES[i18n.locale].monsoons[k]) ||
    fallback || {
      vectorName: BUNDLES[i18n.locale].fallback.unknownMonsoon,
      originSource: BUNDLES[i18n.locale].fallback.unknownMonsoon,
      flowSpeed: BUNDLES[i18n.locale].fallback.text,
      weatherImpact: BUNDLES[i18n.locale].fallback.unknownMonsoon,
      upcomingForecast: BUNDLES[i18n.locale].fallback.unknownMonsoon
    }
  );
}

export function localizedSystem(i18n: I18n, key: string | undefined): string {
  const k = (SYSTEM_KEYS.includes(key as SystemKey) ? key : undefined) as SystemKey | undefined;
  if (!k) return BUNDLES[i18n.locale].fallback.unknownSystem;
  return BUNDLES[i18n.locale].systems[k] ?? BUNDLES[DEFAULT_LOCALE].systems[k] ?? BUNDLES[i18n.locale].fallback.unknownSystem;
}

export interface LocalizedAlert {
  type: string;
  title: string;
  triggerCause: string;
  defenseProtocol: readonly string[];
}

export function localizedAlert(
  i18n: I18n,
  key: string | undefined,
  params?: Record<string, string | number>
): LocalizedAlert {
  const k = (ALERT_KEYS.includes(key as AlertKey) ? key : undefined) as AlertKey | undefined;
  const dash = BUNDLES[i18n.locale].fallback.text;
  const pick = (b: LocaleBundle): AlertBundle | null => (k ? b.alerts[k] : null);
  const current = k ? pick(BUNDLES[i18n.locale]) : null;
  const base = current ?? (i18n.locale === DEFAULT_LOCALE ? null : pick(BUNDLES[DEFAULT_LOCALE]));
  if (!base) {
    const unknown = BUNDLES[i18n.locale].fallback.unknownAlert;
    return { type: unknown, title: unknown, triggerCause: unknown, defenseProtocol: [] };
  }
  return {
    type: base.type,
    title: base.title,
    triggerCause: interpolate(base.triggerCause, params, dash),
    defenseProtocol: base.defenseProtocol.length > 0 ? base.defenseProtocol : [BUNDLES[i18n.locale].fallback.text]
  };
}
