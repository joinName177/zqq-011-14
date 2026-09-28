import {
  MoodRecord,
  BarometricZone,
  MonsoonTrend,
  ExtremeWeatherAlert,
  SynopticChartData
} from './models';
import {
  Locale,
  WindDirCode,
  WIND_DIR_CODES,
  MonsoonCode,
  PressureSystemCode,
  AlertCode,
  normalizeTagCode,
  TAG_NUMERIC_DEFAULTS,
  todayDateString
} from './i18n';

const WIND_DIRS: WindDirCode[] = [...WIND_DIR_CODES];

export function createRecordFromTag(
  tag: string,
  intensity: number,
  note: string,
  dateStr?: string,
  locale: Locale = 'zh'
): MoodRecord {
  const code = normalizeTagCode(tag);
  const defaults = TAG_NUMERIC_DEFAULTS[code];
  const pressureOffset = (5 - intensity) * 3;
  const pressureHpa = Math.max(960, Math.min(1045, defaults.pressure + pressureOffset));
  const tempOffset = (intensity - 5) * 1.2;
  const temperatureC = Math.round(defaults.temp + tempOffset);
  const humidityPercent = Math.min(100, Math.max(20, defaults.humidity + (intensity > 6 ? 10 : -5)));

  const dirIdx = Math.abs((code.charCodeAt(0) + intensity) % 8);
  const windDirection: WindDirCode = WIND_DIRS[dirIdx];
  const windDeg = dirIdx * 45;
  const windSpeed = 5 + intensity * 3.5;

  return {
    id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: dateStr || todayDateString(),
    tag: code,
    intensity,
    note: note.trim() || defaultNote(locale),
    pressureHpa,
    temperatureC,
    humidityPercent,
    windSpeedKmH: Math.round(windSpeed),
    windDirectionDeg: windDeg,
    windDirection
  };
}

function defaultNote(locale: Locale): string {
  // 默认观测注记（界面文案，非用户内容）
  return locale === 'en' ? 'Routine observation' : '平静观测记录';
}

// 兼容旧版本记录：中文标签/风向名迁移为稳定编码。
// Migrate legacy records that stored Chinese tag/wind strings.
const LEGACY_WIND_MAP: Record<string, WindDirCode> = {
  东北: 'ne', 东: 'e', 东南: 'se', 南: 's', 西南: 'sw', 西: 'w', 西北: 'nw', 北: 'n'
};

export function migrateRecord(raw: Partial<MoodRecord> & Record<string, unknown>): MoodRecord {
  const tag = normalizeTagCode((raw.tag as string) ?? undefined);
  const windRaw = (raw.windDirection ?? raw.windDirectionName ?? '') as string;
  const windDirection =
    (WIND_DIRS as readonly string[]).includes(windRaw)
      ? (windRaw as WindDirCode)
      : LEGACY_WIND_MAP[windRaw] ?? 'e';
  return {
    id: String(raw.id ?? `rec-migrated-${Date.now()}`),
    date: typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : '1970-01-01',
    tag,
    intensity: Number(raw.intensity ?? 5),
    note: typeof raw.note === 'string' ? raw.note : '',
    pressureHpa: Number(raw.pressureHpa ?? 1000),
    temperatureC: Number(raw.temperatureC ?? 20),
    humidityPercent: Number(raw.humidityPercent ?? 50),
    windSpeedKmH: Number(raw.windSpeedKmH ?? 20),
    windDirectionDeg: Number(raw.windDirectionDeg ?? 90),
    windDirection
  };
}

export function evaluateSynopticSystem(records: MoodRecord[], locale: Locale = 'zh'): SynopticChartData {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const currentRecord = sorted[sorted.length - 1] || createRecordFromTag('cloudy_to_overcast', 5, '', undefined, locale);

  const totalPressure = sorted.reduce((acc, r) => acc + r.pressureHpa, 0);
  const avgPressure = Math.round(totalPressure / (sorted.length || 1));

  // Barometric zones analysis
  let equatorial = 0; // high intensity + low/moderate pressure
  let subTropical = 0; // high pressure sunny
  let subPolar = 0; // low pressure sad/fog
  let polarCold = 0; // high pressure freezing/detached

  sorted.forEach(r => {
    if (r.pressureHpa >= 1020 && r.temperatureC > 15) subTropical++;
    else if (r.pressureHpa >= 1020 && r.temperatureC <= 10) polarCold++;
    else if (r.pressureHpa <= 995) subPolar++;
    else equatorial++;
  });

  const total = sorted.length || 1;
  const ratio = (n: number) => Math.round((n / total) * 100);

  const zones: BarometricZone[] = [
    {
      code: 'z_sth',
      pressureMin: 1018,
      pressureMax: 1030,
      activeRatio: ratio(subTropical),
      status: subTropical >= total * 0.35 ? 'dominant' : 'active'
    },
    {
      code: 'z_equ',
      pressureMin: 1000,
      pressureMax: 1015,
      activeRatio: ratio(equatorial),
      status: equatorial >= total * 0.35 ? 'dominant' : 'active'
    },
    {
      code: 'z_spl',
      pressureMin: 970,
      pressureMax: 998,
      activeRatio: ratio(subPolar),
      status: subPolar >= total * 0.35 ? 'dominant' : 'active'
    },
    {
      code: 'z_pol',
      pressureMin: 1025,
      pressureMax: 1045,
      cold: true,
      activeRatio: ratio(polarCold),
      status: polarCold >= total * 0.2 ? 'dominant' : 'receding'
    }
  ];

  // Monsoon trend analysis
  const recentSlice = sorted.slice(-7);
  const hasStorm = recentSlice.some(r => r.pressureHpa < 985);

  let monsoonCode: MonsoonCode = 'calm_south';
  let flowSpeedKmh = 12;
  let windAngle = 135;

  if (avgPressure < 995 || hasStorm) {
    monsoonCode = 'cyclonic_sw';
    flowSpeedKmh = 48;
    windAngle = 225;
  } else if (avgPressure > 1020) {
    monsoonCode = 'subtropical_ridge';
    flowSpeedKmh = 18;
    windAngle = 270;
  }

  const monsoon: MonsoonTrend = {
    code: monsoonCode,
    frequencyDays: recentSlice.length,
    flowSpeedKmh,
    windAngle
  };

  // Alerts —— 仅输出编码与数值参数，文案在本地化层解析。
  // Emit only codes + numeric params; copy is resolved in the localization layer.
  const alerts: ExtremeWeatherAlert[] = [];
  const lastRecord = currentRecord;

  if (lastRecord.pressureHpa < 980 || (lastRecord.tag === 'sudden_thunderstorm' && lastRecord.intensity >= 8)) {
    alerts.push(buildAlert('red_storm', lastRecord.date));
  } else if (lastRecord.tag === 'scattered_anxiety' && lastRecord.intensity >= 7) {
    alerts.push(buildAlert('orange_anxiety', lastRecord.date));
  } else if (lastRecord.tag === 'cold_surge_gale') {
    alerts.push(buildAlert('yellow_cold', lastRecord.date));
  }

  function buildAlert(code: AlertCode, issuedTime: string): ExtremeWeatherAlert {
    return {
      id: `alert-${code}`,
      code,
      level: code === 'red_storm' ? 'red' : code === 'orange_anxiety' ? 'orange' : 'yellow',
      issuedTime,
      params: {
        pressure: lastRecord.pressureHpa,
        humidity: lastRecord.humidityPercent,
        temperature: lastRecord.temperatureC
      }
    };
  }

  // Determine system type
  let pressureSystemType: PressureSystemCode = 'extratropical_anticyclone';
  if (avgPressure >= 1020) pressureSystemType = 'subtropical_clear';
  else if (avgPressure < 990) pressureSystemType = 'deep_cold_vortex';
  else if (alerts.length > 0) pressureSystemType = 'frontal_cyclone';
  else pressureSystemType = 'deep_trough_gloom';

  return {
    chartId: `SYN-${Date.now().toString(36).toUpperCase()}`,
    generatedDate: todayDateString(),
    currentRecord,
    records: sorted,
    averagePressure: avgPressure,
    zones,
    monsoon,
    alerts,
    pressureSystemType
  };
}
