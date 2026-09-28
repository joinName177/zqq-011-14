// 统一本地化基础设施：locale 资源、回退查找、数字 / 日期格式化。
// Unified localization: locale resources, fallback lookup, number/date formatting.

export type Locale = 'zh' | 'en';
export const SUPPORTED_LOCALES: readonly Locale[] = ['zh', 'en'];
export const DEFAULT_LOCALE: Locale = 'zh';

const LOCALE_STORAGE_KEY = 'mood_meteorology_locale_v1';
const BROWSER_LOCALE: Locale =
  typeof navigator !== 'undefined' && (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';

// ---- 稳定编码（不参与翻译、可安全持久化）/ Stable codes ---------------------

export const MOOD_TAG_CODES = [
  'clear_sky',
  'gentle_breeze',
  'cloudy_to_overcast',
  'low_pressure_fog',
  'scattered_anxiety',
  'warm_humid_front',
  'sudden_thunderstorm',
  'cold_surge_gale'
] as const;
export type MoodTagCode = (typeof MOOD_TAG_CODES)[number];

export const WIND_DIR_CODES = ['ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'n'] as const;
export type WindDirCode = (typeof WIND_DIR_CODES)[number];

export const ZONE_CODES = ['z_sth', 'z_equ', 'z_spl', 'z_pol'] as const;
export type ZoneCode = (typeof ZONE_CODES)[number];

export const MONSOON_CODES = ['calm_south', 'cyclonic_sw', 'subtropical_ridge'] as const;
export type MonsoonCode = (typeof MONSOON_CODES)[number];

export const SYSTEM_CODES = [
  'extratropical_anticyclone',
  'subtropical_clear',
  'deep_cold_vortex',
  'frontal_cyclone',
  'deep_trough_gloom'
] as const;
export type PressureSystemCode = (typeof SYSTEM_CODES)[number];

export const ALERT_LEVEL_CODES = ['blue', 'yellow', 'orange', 'red'] as const;
export type AlertLevelCode = (typeof ALERT_LEVEL_CODES)[number];

export const ALERT_CODES = ['red_storm', 'orange_anxiety', 'yellow_cold'] as const;
export type AlertCode = (typeof ALERT_CODES)[number];

// 旧版本 localStorage 中直接保存了中文标签，需要无损迁移到稳定编码。
const LEGACY_TAG_MAP: Record<string, MoodTagCode> = {
  晴空万里: 'clear_sky',
  微风煦暖: 'gentle_breeze',
  阴转多云: 'cloudy_to_overcast',
  低气压大雾: 'low_pressure_fog',
  局部有焦虑: 'scattered_anxiety',
  暖湿气流过境: 'warm_humid_front',
  突发雷暴: 'sudden_thunderstorm',
  寒潮大风: 'cold_surge_gale'
};

export function normalizeTagCode(raw: string | undefined | null): MoodTagCode {
  if (raw && (MOOD_TAG_CODES as readonly string[]).includes(raw)) return raw as MoodTagCode;
  if (raw && LEGACY_TAG_MAP[raw]) return LEGACY_TAG_MAP[raw];
  return 'cloudy_to_overcast';
}

// ---- 词条资源 / Message resources ------------------------------------------

export interface TagStrings {
  label: string;
  windDesc: string;
}

export interface ZoneStrings {
  name: string;
  state: string;
  description: string;
}

export interface MonsoonStrings {
  vectorName: string;
  originSource: string;
  weatherImpact: string;
  upcomingForecast: string;
}

export interface AlertStrings {
  type: string;
  title: string;
  cause: (p: AlertCauseParams) => string;
  defense: string[];
}

export interface AlertCauseParams {
  pressure: string;
  humidity: string;
  temperature: string;
}

export interface Messages {
  app: {
    title: string;
    subtitle: string;
    reset: string;
    record: string;
    langToggle: string;
  };
  pressure: {
    suffix: string; // hPa 名称
    lowConvection: string;
    highAnticyclone: string;
    humidityHumid: string;
    humidityDry: string;
    feelsGood: string;
    windSuffix: string; // “风” / wind noun suffix
  };
  telemetry: {
    barometer: string;
    temperature: string;
    humidity: string;
    windField: string;
  };
  chart: {
    title: string;
    stationLabel: string;
  };
  legend: {
    low: string;
    high: string;
    isobar: string;
    windVector: string;
  };
  timeline: {
    title: string;
  };
  zones: {
    title: string;
    frequency: (n: number) => string;
    items: Record<ZoneCode, ZoneStrings>;
  };
  monsoon: {
    title: string;
    originForce: string;
    flowSpeed: string;
    forecastTitle: string;
    items: Record<MonsoonCode, MonsoonStrings>;
  };
  alerts: {
    title: string;
    warningSuffix: string; // “预警” / “Alert”
    issuedAt: (date: string) => string;
    defenseTitle: string;
    allClear: string;
    levels: Record<AlertLevelCode, string>;
    items: Record<AlertCode, AlertStrings>;
  };
  modal: {
    title: string;
    chooseTag: string;
    intensity: (v: number) => string;
    noteLabel: string;
    notePlaceholder: string;
    cancel: string;
    submit: string;
  };
  summary: {
    zoneCount: (n: number) => string;
    zoneUnit: string;
    none: string;
  };
}

const zh: Messages = {
  app: {
    title: '情绪天气台 · 心灵气象图系统',
    subtitle: 'PSYCHOLOGICAL METEOROLOGICAL OBSERVATORY & SYNOPTIC CHART',
    reset: '🔄 重置示例气象序列',
    record: '✍️ 记录今日心情天气',
    langToggle: 'EN'
  },
  pressure: {
    suffix: 'hPa',
    lowConvection: '低压对流',
    highAnticyclone: '高压反气旋',
    humidityHumid: '湿润多云',
    humidityDry: '清爽干燥',
    feelsGood: '体感适宜度良好',
    windSuffix: '风'
  },
  telemetry: {
    barometer: '心境气压 (Barometer)',
    temperature: '情绪温度 (Temperature)',
    humidity: '心理湿度 (Humidity)',
    windField: '思绪风场 (Wind Field)'
  },
  chart: {
    title: '🌐 个人专属情绪综观天气图 (Synoptic Chart)',
    stationLabel: '气压观测点'
  },
  legend: {
    low: '低压中心 (L) / 气旋雨带',
    high: '高压中心 (H) / 晴朗平稳',
    isobar: '等压线 (Isobars)',
    windVector: '风向矢量箭头'
  },
  timeline: {
    title: '📅 近期气象观测序列 (点击切换观测标本)'
  },
  zones: {
    title: '🧭 情绪气压带分布',
    frequency: n => `${n}% 频次`,
    items: {
      z_sth: {
        name: '副热带高压带（心境晴朗稳定）',
        state: '精力平稳、秩序感充足、心态从容明朗',
        description: '受反气旋沉降气流控制，天空云量稀少，注意力聚焦，内耗极低。'
      },
      z_equ: {
        name: '赤道低压槽（充沛对流与灵感）',
        state: '情绪敏感、灵感涌动、轻微情绪躁动',
        description: '对流活动旺盛，情绪水汽充沛，容易产生即兴表达欲与探索热情。'
      },
      z_spl: {
        name: '副极地低气压带（低落潮湿阻滞）',
        state: '情绪内耗、局部焦虑、精力低谷期',
        description: '暖冷气团交汇形成持久锋面雨带，情绪云层厚重，阳光穿透力减弱。'
      },
      z_pol: {
        name: '极地冷高压区（情感冷却与封闭）',
        state: '冷漠理性、拒绝社交、自我防御开启',
        description: '温度跌破防御线，地表热量迅速散失，表现为情绪冷淡与沉默。'
      }
    }
  },
  monsoon: {
    title: '🌬️ 季风走势与大气环流',
    originForce: '流场源动力：',
    flowSpeed: '流动强度：',
    forecastTitle: '未来三日气象推演：',
    items: {
      calm_south: {
        vectorName: '东亚温和偏南季风',
        originSource: '来自生活日常与适度社交温和气团',
        weatherImpact: '气压平衡，情绪系统处于舒适自净区间',
        upcomingForecast: '预计未来三天无明显冷空气入侵，维持多云转晴趋势。'
      },
      cyclonic_sw: {
        vectorName: '西南热带气旋逆时针切变流',
        originSource: '来自多重待办任务与社交过载的深层热低压',
        weatherImpact: '带来间歇性焦虑降水与情绪飑线，心理湿度高居不下',
        upcomingForecast: '警惕情绪二次对流反弹，建议尽早启动防灾避雨防御。'
      },
      subtropical_ridge: {
        vectorName: '高压脊平直西风气流',
        originSource: '来自坚实生活秩序与专注工作带来的稳定反气旋',
        weatherImpact: '视界清晰无云，情绪能见度极高，适合规划长期战略',
        upcomingForecast: '高压系统稳定，气温宜人，建议保持当前生活节律。'
      }
    }
  },
  alerts: {
    title: '⚠️ 极端天气预警与自愈指南',
    warningSuffix: '预警',
    issuedAt: date => `${date} 发布`,
    defenseTitle: '🛡️ 防灾避险自愈协议：',
    allClear: '✅ 当前心境空域晴朗，无活动极端灾害天气警报。',
    levels: { blue: '蓝色', yellow: '黄色', orange: '橙色', red: '红色' },
    items: {
      red_storm: {
        type: '情绪特大暴雨与雷电暴风预警',
        title: '红色暴雨预警 · 情绪超负荷对流',
        cause: p => `中心气压降至 ${p.pressure}hPa，阵风超速，局部心理降水量达特大暴雨级别。`,
        defense: [
          '立即暂停所有高摩擦高风险的人际沟通与决策。',
          '退回物理安全区（卧室/安静角落），拉上窗帘切断过多声光刺激。',
          '进行5次深长腹式呼吸，允许眼泪或倾诉作为自然水汽释放。',
          '备用应急热饮（热牛奶或洋甘菊茶），等待气旋中心移出。'
        ]
      },
      orange_anxiety: {
        type: '干热高温与强对流焦虑预警',
        title: '橙色预警 · 局部焦虑气团盘旋',
        cause: p => `心理湿度高达 ${p.humidity}%，内热积蓄，出现明显心率过载与思绪乱流。`,
        defense: [
          '执行“注意力物理降温”：离开发生焦虑的工位，步行洗脸或冷水洗手。',
          '将脑中盘旋的所有待办事项写在纸上，关停后台大脑线程。',
          '禁止在当夜进行自我复盘或批判，推迟至明早高压回升后再议。'
        ]
      },
      yellow_cold: {
        type: '情感寒潮与社交冰封预警',
        title: '黄色预警 · 极地干冷冷锋压境',
        cause: p => `气温剧烈骤降至 ${p.temperature}°C，情绪能量趋近冰点，防御性坚冰形成。`,
        defense: [
          '不必强迫自己热情回应外界信息，开启社交请假条/免打扰模式。',
          '通过热汤、暖水袋、厚毯子提供基础躯体热量。',
          '倾听白噪音或重温一部熟悉的童年治愈老电影。'
        ]
      }
    }
  },
  modal: {
    title: '✍️ 今日心情气象签到',
    chooseTag: '选择今日核心气象标签：',
    intensity: v => `气象对流强度 (1 - 10 级)：${v}`,
    noteLabel: '观测记录与心绪注记：',
    notePlaceholder: '写下引起今天气压变化的事情或思绪...',
    cancel: '取消',
    submit: '保存并更新气象图'
  },
  summary: {
    zoneCount: n => `${n} 个气压带`,
    zoneUnit: '个气压带',
    none: '暂无'
  }
};

const en: Messages = {
  app: {
    title: 'Mood Weather Station · Synoptic Chart of the Mind',
    subtitle: 'PSYCHOLOGICAL METEOROLOGICAL OBSERVATORY & SYNOPTIC CHART',
    reset: '🔄 Reset sample weather sequence',
    record: '✍️ Log today’s mood weather',
    langToggle: '中文'
  },
  pressure: {
    suffix: 'hPa',
    lowConvection: 'Low-pressure convection',
    highAnticyclone: 'High-pressure anticyclone',
    humidityHumid: 'Humid & overcast',
    humidityDry: 'Fresh & dry',
    feelsGood: 'Comfort level: good',
    windSuffix: ' wind'
  },
  telemetry: {
    barometer: 'Mind Barometer',
    temperature: 'Emotional Temperature',
    humidity: 'Psychological Humidity',
    windField: 'Thought Wind Field'
  },
  chart: {
    title: '🌐 Personal Emotional Synoptic Chart',
    stationLabel: 'Pressure station'
  },
  legend: {
    low: 'Low-pressure center (L) / cyclonic rain band',
    high: 'High-pressure center (H) / calm & clear',
    isobar: 'Isobars',
    windVector: 'Wind vectors'
  },
  timeline: {
    title: '📅 Recent observations (tap a specimen to focus)'
  },
  zones: {
    title: '🧭 Mood Pressure Belts',
    frequency: n => `${n}% frequency`,
    items: {
      z_sth: {
        name: 'Subtropical High Belt (clear & stable)',
        state: 'Steady energy, strong sense of order, calm and bright',
        description: 'Controlled by subsiding anticyclonic air: sparse cloud cover, sharp focus, minimal internal friction.'
      },
      z_equ: {
        name: 'Equatorial Trough (convection & inspiration)',
        state: 'Emotionally sensitive, inspired, lightly restless',
        description: 'Vigorous convection and abundant emotional moisture spark spontaneous expression and curiosity.'
      },
      z_spl: {
        name: 'Subpolar Low Belt (low, damp, sluggish)',
        state: 'Mental drain, scattered anxiety, low-energy period',
        description: 'Persistent frontal rain bands where warm and cold air masses meet; heavy emotional cloud weakens the sunlight.'
      },
      z_pol: {
        name: 'Polar Cold High (emotional cooling & closure)',
        state: 'Detached rationality, social withdrawal, defenses up',
        description: 'Temperatures fall below the defensive line and surface heat escapes quickly, showing as coldness and silence.'
      }
    }
  },
  monsoon: {
    title: '🌬️ Monsoon Trends & Atmospheric Circulation',
    originForce: 'Driving source: ',
    flowSpeed: 'Flow intensity: ',
    forecastTitle: 'Three-day outlook: ',
    items: {
      calm_south: {
        vectorName: 'Mild East Asian southerly monsoon',
        originSource: 'Gentle air mass from daily life and moderate social contact',
        weatherImpact: 'Balanced pressure; the emotional system sits in a comfortable self-cleansing range',
        upcomingForecast: 'No cold air intrusion expected over the next three days; clouds will give way to clear skies.'
      },
      cyclonic_sw: {
        vectorName: 'Counter-clockwise SW tropical cyclonic shear',
        originSource: 'Deep thermal low from overlapping tasks and social overload',
        weatherImpact: 'Brings intermittent anxiety showers and emotional squall lines with persistently high mental humidity',
        upcomingForecast: 'Watch for a second round of convective rebound; raise storm defenses early.'
      },
      subtropical_ridge: {
        vectorName: 'Zonal westerly flow along the subtropical ridge',
        originSource: 'Stable anticyclone from solid routines and focused work',
        weatherImpact: 'Clear visibility with no clouds; ideal conditions for long-term planning',
        upcomingForecast: 'The high-pressure system holds with pleasant temperatures; keep your current rhythm.'
      }
    }
  },
  alerts: {
    title: '⚠️ Extreme Weather Alerts & Self-Care Guide',
    warningSuffix: ' Alert',
    issuedAt: date => `Issued ${date}`,
    defenseTitle: '🛡️ Self-care & shelter protocol:',
    allClear: '✅ The mind’s airspace is clear; no active extreme-weather alerts.',
    levels: { blue: 'Blue', yellow: 'Yellow', orange: 'Orange', red: 'Red' },
    items: {
      red_storm: {
        type: 'Severe emotional rainstorm & thunderstorm warning',
        title: 'Red Rainstorm Alert · emotional overload convection',
        cause: p =>
          `Central pressure has dropped to ${p.pressure} hPa with excessive gusts; local mental rainfall has reached severe storm levels.`,
        defense: [
          'Pause all high-friction, high-stakes conversations and decisions immediately.',
          'Withdraw to a physical safe space (bedroom / quiet corner); draw the curtains to cut excess light and noise.',
          'Take five slow diaphragmatic breaths; allow tears or talking things through as natural moisture release.',
          'Keep an emergency warm drink handy (warm milk or chamomile tea) while the cyclone core moves on.'
        ]
      },
      orange_anxiety: {
        type: 'Dry heat & strong convective anxiety warning',
        title: 'Orange Alert · scattered anxiety air mass lingering',
        cause: p =>
          `Mental humidity has climbed to ${p.humidity}%; internal heat builds with visible heart-rate overload and turbulent thoughts.`,
        defense: [
          'Perform an “attention cooldown”: leave the anxiety-triggering desk; walk, wash your face or hands with cold water.',
          'Write every circling to-do on paper and shut down the brain’s background threads.',
          'No self-review or self-criticism tonight; postpone it until tomorrow morning after pressure recovers.'
        ]
      },
      yellow_cold: {
        type: 'Emotional cold surge & social freeze warning',
        title: 'Yellow Alert · polar dry cold front pressing in',
        cause: p =>
          `Temperature has plunged to ${p.temperature}°C; emotional energy nears freezing and defensive ice is forming.`,
        defense: [
          'Do not force warm responses to incoming messages; grant yourself a social pass / do-not-disturb mode.',
          'Supply baseline bodily warmth with hot soup, a hot-water bottle and thick blankets.',
          'Listen to white noise or rewatch a familiar childhood comfort film.'
        ]
      }
    }
  },
  modal: {
    title: '✍️ Today’s Mood Weather Check-in',
    chooseTag: 'Core weather tag for today:',
    intensity: v => `Convective intensity (level 1 – 10): ${v}`,
    noteLabel: 'Observation notes:',
    notePlaceholder: 'Write what moved today’s pressure — events or thoughts…',
    cancel: 'Cancel',
    submit: 'Save & update chart'
  },
  summary: {
    zoneCount: n => `${n} pressure belts`,
    zoneUnit: 'pressure belts',
    none: 'N/A'
  }
};

export const MESSAGES: Record<Locale, Messages> = { zh, en };

// ---- 运行时 locale 状态 / Runtime locale state -----------------------------

export function getInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    // localStorage 不可用时忽略 / ignore when unavailable
  }
  return BROWSER_LOCALE;
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'zh' ? 'en' : 'zh';
}

// 回退顺序：目标语言 -> 默认语言 -> 原始 key，保证缺失翻译时绝不出现空白。
// Fallback chain: requested locale -> default locale -> raw key, so missing
// translations never render as blank strings.
export function translate(locale: Locale, path: string): string {
  const resolve = (messages: Messages): unknown =>
    path.split('.').reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), messages);

  const value = resolve(MESSAGES[locale]);
  if (typeof value === 'string' && value !== '') return value;
  if (locale !== DEFAULT_LOCALE) {
    const fallback = resolve(MESSAGES[DEFAULT_LOCALE]);
    if (typeof fallback === 'string' && fallback !== '') return fallback;
  }
  return path;
}

// ---- 标签 / 风向词条 / Tag & wind helpers ----------------------------------

const TAG_KEYS: Record<MoodTagCode, { icon: string; category: string; zh: TagStrings; en: TagStrings }> = {
  clear_sky: {
    icon: '☀️',
    category: 'sunny',
    zh: { label: '晴空万里', windDesc: '微风拂面 · 东南风 2级' },
    en: { label: 'Clear Sky', windDesc: 'Light breeze · SE force 2' }
  },
  gentle_breeze: {
    icon: '🌤️',
    category: 'sunny',
    zh: { label: '微风煦暖', windDesc: '和煦暖风 · 南风 3级' },
    en: { label: 'Warm Gentle Breeze', windDesc: 'Warm gentle wind · S force 3' }
  },
  cloudy_to_overcast: {
    icon: '⛅',
    category: 'cloudy',
    zh: { label: '阴转多云', windDesc: '静风无定向 · 气压平缓' },
    en: { label: 'Overcast to Cloudy', windDesc: 'Calm, variable wind · steady pressure' }
  },
  low_pressure_fog: {
    icon: '🌫️',
    category: 'fog',
    zh: { label: '低气压大雾', windDesc: '无风凝滞 · 能见度不足' },
    en: { label: 'Low-Pressure Fog', windDesc: 'Stagnant calm · low visibility' }
  },
  scattered_anxiety: {
    icon: '🌦️',
    category: 'cloudy',
    zh: { label: '局部有焦虑', windDesc: '偏西阵风 5级 · 气旋对流' },
    en: { label: 'Scattered Anxiety', windDesc: 'Westerly gusts force 5 · cyclonic convection' }
  },
  warm_humid_front: {
    icon: '🌧️',
    category: 'rain',
    zh: { label: '暖湿气流过境', windDesc: '西南湿润气流 4级' },
    en: { label: 'Warm Humid Front Passing', windDesc: 'Moist SW airflow force 4' }
  },
  sudden_thunderstorm: {
    icon: '⛈️',
    category: 'storm',
    zh: { label: '突发雷暴', windDesc: '强烈飑线 · 偏北强风 8级' },
    en: { label: 'Sudden Thunderstorm', windDesc: 'Intense squall line · northerly gale force 8' }
  },
  cold_surge_gale: {
    icon: '❄️',
    category: 'snow',
    zh: { label: '寒潮大风', windDesc: '西伯利亚干冷风 7级' },
    en: { label: 'Cold Surge Gale', windDesc: 'Dry Siberian wind force 7' }
  }
};

export interface TagMetaView {
  code: MoodTagCode;
  icon: string;
  label: string;
  windDesc: string;
}

export function getTagMeta(code: MoodTagCode, locale: Locale): TagMetaView {
  const entry = TAG_KEYS[code] ?? TAG_KEYS.cloudy_to_overcast;
  const strings = entry[locale] ?? entry[DEFAULT_LOCALE];
  return { code, icon: entry.icon, label: strings.label, windDesc: strings.windDesc };
}

// 供引擎计算默认气象数值使用（与语言无关）。
// Numeric defaults used by the engine (language independent).
export const TAG_NUMERIC_DEFAULTS: Record<MoodTagCode, { pressure: number; temp: number; humidity: number }> = {
  clear_sky: { pressure: 1024, temp: 24, humidity: 45 },
  gentle_breeze: { pressure: 1018, temp: 22, humidity: 50 },
  cloudy_to_overcast: { pressure: 1008, temp: 18, humidity: 65 },
  low_pressure_fog: { pressure: 998, temp: 14, humidity: 92 },
  scattered_anxiety: { pressure: 992, temp: 26, humidity: 78 },
  warm_humid_front: { pressure: 1002, temp: 25, humidity: 85 },
  sudden_thunderstorm: { pressure: 975, temp: 20, humidity: 95 },
  cold_surge_gale: { pressure: 1032, temp: -2, humidity: 30 }
};

const WIND_DIR_LABELS: Record<Locale, Record<WindDirCode, string>> = {
  zh: { ne: '东北', e: '东', se: '东南', s: '南', sw: '西南', w: '西', nw: '西北', n: '北' },
  en: { ne: 'NE', e: 'E', se: 'SE', s: 'S', sw: 'SW', w: 'W', nw: 'NW', n: 'N' }
};

export function windDirLabel(code: WindDirCode, locale: Locale): string {
  return WIND_DIR_LABELS[locale]?.[code] ?? WIND_DIR_LABELS[DEFAULT_LOCALE][code];
}

const SYSTEM_LABELS: Record<Locale, Record<PressureSystemCode, string>> = {
  zh: {
    extratropical_anticyclone: '温带反气旋平稳',
    subtropical_clear: '副热带高压晴空',
    deep_cold_vortex: '强烈冷涡旋',
    frontal_cyclone: '锋面气旋多变',
    deep_trough_gloom: '深槽低气压阴霾'
  },
  en: {
    extratropical_anticyclone: 'Calm extratropical anticyclone',
    subtropical_clear: 'Subtropical high, clear skies',
    deep_cold_vortex: 'Intense cold vortex',
    frontal_cyclone: 'Variable frontal cyclone',
    deep_trough_gloom: 'Deep low-pressure trough, gloomy'
  }
};

export function systemLabel(code: PressureSystemCode, locale: Locale): string {
  return SYSTEM_LABELS[locale]?.[code] ?? SYSTEM_LABELS[DEFAULT_LOCALE][code] ?? code;
}

// ---- 区域敏感的数字 / 日期格式 / Locale-aware formatters --------------------

const INTL_LOCALE: Record<Locale, string> = { zh: 'zh-CN', en: 'en-US' };

export function formatNumber(value: number, locale: Locale, digits?: number): string {
  const fallback = digits != null ? value.toFixed(digits) : String(value);
  try {
    return new Intl.NumberFormat(INTL_LOCALE[locale], {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value);
  } catch {
    return fallback;
  }
}

// 紧凑整数：气压、风速、频次等带单位的测量值不使用千位分隔符
//（中文气象读数习惯连写，如 1018 hPa / 48 km/h）。
export function formatCompactInt(value: number, locale: Locale): string {
  void locale;
  return String(Math.round(value));
}

// 数值区间：中文用“~”连接，英文用“–”连接。
export function formatRange(min: number, max: number, locale: Locale, unit = ''): string {
  const connector = locale === 'zh' ? ' ~ ' : ' – ';
  const tail = unit ? ` ${unit}` : '';
  return `${formatCompactInt(min, locale)}${connector}${formatCompactInt(max, locale)}${tail}`;
}

// 完整日期：zh 2026/9/27，en Sep 27, 2026
export function formatDate(dateStr: string, locale: Locale): string {
  const date = parseDate(dateStr);
  if (!date) return dateStr || '—';
  try {
    return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateStr;
  }
}

// 时间线短日期：统一口径，不混用 slice 与 toLocaleDateString。
export function formatShortDate(dateStr: string, locale: Locale): string {
  const date = parseDate(dateStr);
  if (!date) return dateStr || '—';
  try {
    return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: 'short', day: 'numeric' }).format(date);
  } catch {
    return dateStr.slice(5);
  }
}

export function parseDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
