import { SynopticChartData, MoodRecord } from '../core/models';
import { TAG_METAS } from '../core/meteorology-engine';
import {
  I18n,
  localizedZone,
  localizedMonsoon,
  localizedAlert,
  tagLabelByKey,
  ALERT_LEVEL_KEY_BY_LABEL,
  type AlertLevelKey
} from '../core/i18n';

export interface WeatherUIHandlers {
  onOpenLogModal: () => void;
  onResetData: () => void;
  onSubmitLog: (tag: string, intensity: number, note: string) => void;
  onSelectRecord: (record: MoodRecord) => void;
  onToggleLocale: () => void;
}

const FALLBACK_TAG = '阴转多云';

export function renderWeatherApp(
  container: HTMLElement,
  chartData: SynopticChartData,
  isModalOpen: boolean,
  selectedTag: string,
  selectedIntensity: number,
  noteText: string,
  handlers: WeatherUIHandlers,
  onCloseModal: () => void,
  onTagChange: (tag: string) => void,
  onIntensityChange: (val: number) => void,
  onNoteChange: (val: string) => void,
  i18n: I18n
) {
  const cur = chartData.currentRecord;
  const meta = TAG_METAS[cur.tag] || TAG_METAS[FALLBACK_TAG];
  const isZh = i18n.locale === 'zh';
  const num = i18n.formatNumber.bind(i18n);

  const esc = (s: string) =>
    s.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));

  /** Bilingual label: Chinese UI keeps the English gloss from the original design. */
  const bi = (key: string, enKey: string) =>
    isZh ? `${i18n.t(key)} (${i18n.t(enKey)})` : i18n.t(enKey);

  const levelClass = (level: string): AlertLevelKey =>
    ALERT_LEVEL_KEY_BY_LABEL[level as keyof typeof ALERT_LEVEL_KEY_BY_LABEL] ?? 'red';

  // Generate Isobar SVG paths dynamically based on records
  const isobarsSvg = `
    <svg class="synoptic-svg" viewBox="0 0 800 380" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(0, 240, 255, 0.15)" />
          <stop offset="50%" stop-color="rgba(58, 134, 255, 0.05)" />
          <stop offset="100%" stop-color="rgba(255, 0, 84, 0.1)" />
        </linearGradient>
        <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
        </pattern>
      </defs>

      <!-- Background Grid -->
      <rect width="100%" height="100%" fill="url(#gridPattern)" />
      <rect width="100%" height="100%" fill="url(#cloudGrad)" />

      <!-- Lat/Long Guides -->
      <line x1="0" y1="190" x2="800" y2="190" stroke="rgba(0, 240, 255, 0.2)" stroke-dasharray="4,4" />
      <line x1="400" y1="0" x2="400" y2="380" stroke="rgba(0, 240, 255, 0.2)" stroke-dasharray="4,4" />
      <text x="410" y="25" fill="rgba(0, 240, 255, 0.4)" font-size="10" font-family="monospace">CENTRAL MERIDIAN 120°E</text>
      <text x="15" y="180" fill="rgba(0, 240, 255, 0.4)" font-size="10" font-family="monospace">PSYCHIC EQUATOR 0°</text>

      <!-- Isobar Concentric Waves -->
      <!-- Center 1: Low pressure trough / cyclone -->
      <g transform="translate(240, 180)">
        <ellipse cx="0" cy="0" rx="200" ry="110" fill="none" stroke="rgba(0, 240, 255, 0.3)" stroke-width="1.5" stroke-dasharray="6,2" />
        <ellipse cx="0" cy="0" rx="140" ry="80" fill="none" stroke="rgba(0, 240, 255, 0.5)" stroke-width="1.5" />
        <ellipse cx="0" cy="0" rx="80" ry="45" fill="none" stroke="rgba(255, 0, 84, 0.6)" stroke-width="2" />
        <circle cx="0" cy="0" r="16" fill="rgba(255, 0, 84, 0.2)" stroke="#ff0054" stroke-width="2" />
        <text x="0" y="5" fill="#ff0054" font-size="13" font-weight="bold" text-anchor="middle">L</text>
        <text x="50" y="-30" fill="#00f0ff" font-size="10">992 hPa</text>
        <text x="100" y="-60" fill="#00f0ff" font-size="10">1004 hPa</text>
      </g>

      <!-- Center 2: High pressure ridge -->
      <g transform="translate(600, 150)">
        <ellipse cx="0" cy="0" rx="180" ry="100" fill="none" stroke="rgba(58, 134, 255, 0.3)" stroke-width="1.5" />
        <ellipse cx="0" cy="0" rx="110" ry="60" fill="none" stroke="rgba(58, 134, 255, 0.6)" stroke-width="1.5" />
        <circle cx="0" cy="0" r="16" fill="rgba(58, 134, 255, 0.2)" stroke="#3a86ff" stroke-width="2" />
        <text x="0" y="5" fill="#3a86ff" font-size="13" font-weight="bold" text-anchor="middle">H</text>
        <text x="-90" y="-40" fill="#3a86ff" font-size="10">1020 hPa</text>
        <text x="-40" y="-10" fill="#3a86ff" font-size="10">1028 hPa</text>
      </g>

      <!-- Cold Front Line (Blue Triangles) -->
      <path d="M 280,70 Q 320,180 390,320" fill="none" stroke="#3a86ff" stroke-width="3" />
      <polygon points="305,120 317,112 312,128" fill="#3a86ff" />
      <polygon points="332,190 344,182 339,198" fill="#3a86ff" />
      <polygon points="365,260 377,252 372,268" fill="#3a86ff" />

      <!-- Warm Front Line (Red Semi-circles) -->
      <path d="M 120,290 Q 200,240 280,260" fill="none" stroke="#ff0054" stroke-width="3" />
      <circle cx="180" cy="254" r="6" fill="#ff0054" />
      <circle cx="240" cy="250" r="6" fill="#ff0054" />

      <!-- Wind Vectors (Arrows) -->
      <g transform="translate(180, 110) rotate(120)">
        <line x1="0" y1="0" x2="35" y2="0" stroke="#00f0ff" stroke-width="2" />
        <polygon points="35,0 26,-4 26,4" fill="#00f0ff" />
      </g>
      <g transform="translate(480, 260) rotate(-45)">
        <line x1="0" y1="0" x2="40" y2="0" stroke="#ffbe0b" stroke-width="2" />
        <polygon points="40,0 30,-4 30,4" fill="#ffbe0b" />
      </g>
      <g transform="translate(620, 310) rotate(-30)">
        <line x1="0" y1="0" x2="32" y2="0" stroke="#ffbe0b" stroke-width="2" />
        <polygon points="32,0 23,-4 23,4" fill="#ffbe0b" />
      </g>

      <!-- Current Location Station Symbol -->
      <g transform="translate(400, 190)">
        <circle cx="0" cy="0" r="14" fill="#070d18" stroke="#00f0ff" stroke-width="2" />
        <text x="0" y="5" font-size="12" text-anchor="middle">${meta.icon}</text>
        <rect x="-65" y="22" width="130" height="24" rx="4" fill="rgba(14,23,38,0.85)" stroke="rgba(0,240,255,0.3)" />
        <text x="0" y="38" fill="#e2eafc" font-size="11" font-weight="bold" text-anchor="middle">${esc(i18n.t('stationPoint', { value: num(cur.pressureHpa) }))}</text>
      </g>
    </svg>
  `;

  const topAlert = chartData.alerts[0];
  const topAlertView = topAlert
    ? localizedAlert(i18n, topAlert.alertKey, {
        pressure: num(topAlert.metrics?.pressureHpa),
        temperature: num(topAlert.metrics?.temperatureC),
        humidity: num(topAlert.metrics?.humidityPercent)
      })
    : null;

  const monsoonView = localizedMonsoon(i18n, chartData.monsoon.monsoonKey);
  const monsoon = {
    vectorName: monsoonView.vectorName || chartData.monsoon.vectorName,
    originSource: monsoonView.originSource || chartData.monsoon.originSource,
    flowSpeed: monsoonView.flowSpeed || chartData.monsoon.flowSpeed,
    upcomingForecast: monsoonView.upcomingForecast || chartData.monsoon.upcomingForecast
  };

  container.innerHTML = `
    <div class="met-app" lang="${i18n.locale === 'zh' ? 'zh-CN' : 'en'}">
      <header class="met-header">
        <div class="met-brand">
          <div class="radar-icon">📡</div>
          <div>
            <h1>${esc(i18n.t('title'))}</h1>
            <p>PSYCHOLOGICAL METEOROLOGICAL OBSERVATORY &amp; SYNOPTIC CHART</p>
          </div>
        </div>
        <div class="met-header-actions">
          <button class="btn-reset" id="btnToggleLocale" title="${esc(i18n.t('langToggleTitle'))}">🌐 ${esc(i18n.t('langToggle'))}</button>
          <button class="btn-reset" id="btnReset">${esc(i18n.t('btnReset'))}</button>
          <button class="btn-record-mood" id="btnOpenLog">${esc(i18n.t('btnRecord'))}</button>
        </div>
      </header>

      ${
        topAlert && topAlertView
          ? `
        <div class="alert-banner">
          <div class="alert-banner-left">
            <span class="alert-tag">${esc(i18n.alertLevel(topAlert.level))}${esc(i18n.t('alertSuffix'))}</span>
            <strong>${esc(topAlertView.title || topAlert.title)}</strong>
            <span style="font-size:13px;color:var(--met-text);">${esc(topAlertView.triggerCause || topAlert.triggerCause)}</span>
          </div>
          <span style="font-size:12px;color:var(--met-muted);">${esc(i18n.t('alertIssuedAt', { date: i18n.formatDate(topAlert.issuedTime) }))}</span>
        </div>
      `
          : ''
      }

      <div class="met-grid">
        <!-- Left: Synoptic Chart & Telemetry -->
        <main class="synoptic-box">
          <div class="box-title">
            <h2>${esc(i18n.t('chartTitle'))}${isZh ? ` (${esc(i18n.t('chartTitleEn'))})` : ''}</h2>
            <span style="font-size:12px;color:var(--met-muted);font-family:monospace;">
              ${chartData.chartId} · ${esc(i18n.formatDate(chartData.generatedDate))}
            </span>
          </div>

          <!-- Current Telemetry -->
          <div class="current-telemetry">
            <div class="telemetry-card">
              <div class="lbl">${esc(bi('telemetryPressure', 'telemetryPressureEn'))}</div>
              <div class="val" style="color:var(--met-cyan);">${num(cur.pressureHpa)} <span style="font-size:12px;">hPa</span></div>
              <div class="lbl">${esc(cur.pressureHpa < 1000 ? i18n.t('pressureLow') : i18n.t('pressureHigh'))}</div>
            </div>
            <div class="telemetry-card">
              <div class="lbl">${esc(bi('telemetryTemp', 'telemetryTempEn'))}</div>
              <div class="val" style="color:var(--met-gold);">${num(cur.temperatureC)} <span style="font-size:12px;">°C</span></div>
              <div class="lbl">${esc(i18n.t('tempComfort'))}</div>
            </div>
            <div class="telemetry-card">
              <div class="lbl">${esc(bi('telemetryHumidity', 'telemetryHumidityEn'))}</div>
              <div class="val" style="color:var(--met-blue);">${num(cur.humidityPercent)}%</div>
              <div class="lbl">${esc(cur.humidityPercent > 80 ? i18n.t('humidityWet') : i18n.t('humidityDry'))}</div>
            </div>
            <div class="telemetry-card">
              <div class="lbl">${esc(bi('telemetryWind', 'telemetryWindEn'))}</div>
              <div class="val" style="color:#fff;">${esc(i18n.t('windDirection', { dir: i18n.windName(cur.windDirectionKey || cur.windDirectionName) }))}</div>
              <div class="lbl">${esc(i18n.t('unitKmh', { value: num(cur.windSpeedKmH) }))}</div>
            </div>
          </div>

          <!-- SVG Weather Map -->
          <div class="synoptic-map-wrap">
            ${isobarsSvg}
          </div>

          <div class="map-legend">
            <div class="legend-item"><div class="legend-color" style="background:#ff0054;"></div><span>${esc(i18n.t('legendLow'))}</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#3a86ff;"></div><span>${esc(i18n.t('legendHigh'))}</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#00f0ff;"></div><span>${esc(i18n.t('legendIsobars'))}</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#ffbe0b;"></div><span>${esc(i18n.t('legendWind'))}</span></div>
          </div>

          <!-- Recent Days Sequence Strip -->
          <div class="timeline-section">
            <h3>${esc(i18n.t('timelineTitle'))}</h3>
            <div class="records-strip">
              ${chartData.records
                .map(
                  r => `
                <div class="record-pill ${r.id === cur.id ? 'active' : ''}" data-id="${r.id}">
                  <div class="pill-date">${esc(i18n.formatDate(r.date, 'short'))}</div>
                  <div class="pill-icon">${(TAG_METAS[r.tag] || TAG_METAS[FALLBACK_TAG]).icon}</div>
                  <div class="pill-tag">${esc(i18n.tagLabel(r.tag))}</div>
                  <div class="pill-pressure">${num(r.pressureHpa)} hPa</div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </main>

        <!-- Right: Zones, Monsoon, Alerts -->
        <aside class="right-column">
          <!-- Barometric Zones -->
          <section class="side-panel">
            <h3>${esc(i18n.t('zonesTitle'))}</h3>
            <div class="zone-list">
              ${chartData.zones
                .map(z => {
                  const view = localizedZone(i18n, z.zoneKey);
                  const name = view.name || z.name;
                  const state = view.state || z.psychologicalState;
                  return `
                <div class="zone-card">
                  <div class="zone-header">
                    <span class="zone-name">${esc(name)}</span>
                    <span class="zone-ratio">${esc(i18n.t('zoneFrequency', { value: num(z.activeRatio) }))}</span>
                  </div>
                  <div class="zone-progress-bg">
                    <div class="zone-progress-fill" style="width: ${z.activeRatio}%"></div>
                  </div>
                  <div class="zone-desc">${esc(state)}</div>
                </div>
              `;
                })
                .join('')}
            </div>
          </section>

          <!-- Monsoon Trends -->
          <section class="side-panel">
            <h3>${esc(i18n.t('monsoonTitle'))}</h3>
            <div class="monsoon-card">
              <div class="monsoon-vector-title">
                <span>🍃</span>
                <span>${esc(monsoon.vectorName)}</span>
              </div>
              <div class="monsoon-meta">
                <div>${esc(i18n.t('monsoonOrigin', { value: monsoon.originSource }))}</div>
                <div>${esc(i18n.t('monsoonSpeed', { value: monsoon.flowSpeed }))}</div>
              </div>
              <div class="monsoon-forecast-box">
                <strong>${esc(i18n.t('monsoonForecastTitle'))}</strong>
                <div>${esc(monsoon.upcomingForecast)}</div>
              </div>
            </div>
          </section>

          <!-- Extreme Weather Alerts -->
          <section class="side-panel">
            <h3>${esc(i18n.t('alertsTitle'))}</h3>
            <div class="alerts-list">
              ${
                chartData.alerts.length > 0
                  ? chartData.alerts
                      .map(a => {
                        const view = localizedAlert(i18n, a.alertKey, {
                          pressure: num(a.metrics?.pressureHpa),
                          temperature: num(a.metrics?.temperatureC),
                          humidity: num(a.metrics?.humidityPercent)
                        });
                        const title = view.title || a.title;
                        const cause = view.triggerCause || a.triggerCause;
                        const steps = view.defenseProtocol.length > 0 ? view.defenseProtocol : a.defenseProtocol;
                        return `
                    <div class="alert-item ${levelClass(a.level)}">
                      <div class="alert-title-row">
                        <span class="alert-name">${esc(title)}</span>
                        <span class="alert-level-badge alert-level-${levelClass(a.level)}">${esc(i18n.alertLevel(a.level))}</span>
                      </div>
                      <div class="alert-cause">${esc(cause)}</div>
                      <div class="defense-guide-title">${esc(i18n.t('defenseTitle'))}</div>
                      <ul class="defense-list">
                        ${steps.map(p => `<li>${esc(p)}</li>`).join('')}
                      </ul>
                    </div>
                  `;
                      })
                      .join('')
                  : `
                    <div style="font-size:13px;color:var(--met-muted);background:var(--met-card);padding:14px;border-radius:8px;">
                      ${esc(i18n.t('alertsEmpty'))}
                    </div>
                  `
              }
            </div>
          </section>
        </aside>
      </div>

      <!-- Modal: Record Daily Mood Weather -->
      ${
        isModalOpen
          ? `
        <div class="modal-backdrop" id="modalBackdrop">
          <div class="modal-dialog">
            <h3>${esc(i18n.t('modalTitle'))}</h3>

            <label style="font-size:12px;color:var(--met-muted);display:block;margin-bottom:8px;">${esc(i18n.t('modalChooseTag'))}</label>
            <div class="tag-selector-grid">
              ${Object.values(TAG_METAS)
                .map(
                  m => `
                <button type="button" class="tag-btn ${m.tag === selectedTag ? 'active' : ''}" data-tag-key="${m.key}">
                  <span style="font-size:16px;">${m.icon}</span>
                  <span>${esc(i18n.tagLabel(m.tag))}</span>
                </button>
              `
                )
                .join('')}
            </div>

            <div class="form-group">
              <label>${esc(i18n.t('modalIntensity'))} <span id="intensityVal" style="color:var(--met-cyan);font-weight:bold;">${selectedIntensity}</span></label>
              <input type="range" class="form-range" id="intensityInput" min="1" max="10" value="${selectedIntensity}" />
            </div>

            <div class="form-group">
              <label>${esc(i18n.t('modalNote'))}</label>
              <textarea class="form-textarea" id="noteInput" placeholder="${esc(i18n.t('modalNotePlaceholder'))}">${esc(noteText)}</textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-reset" id="btnCancelModal">${esc(i18n.t('modalCancel'))}</button>
              <button type="button" class="btn-record-mood" id="btnSubmitModal">${esc(i18n.t('modalSubmit'))}</button>
            </div>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;

  // Attach event listeners
  container.querySelector('#btnOpenLog')?.addEventListener('click', handlers.onOpenLogModal);
  container.querySelector('#btnReset')?.addEventListener('click', handlers.onResetData);
  container.querySelector('#btnToggleLocale')?.addEventListener('click', handlers.onToggleLocale);

  container.querySelectorAll('.record-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const id = pill.getAttribute('data-id');
      const rec = chartData.records.find(r => r.id === id);
      if (rec) handlers.onSelectRecord(rec);
    });
  });

  if (isModalOpen) {
    container.querySelectorAll('.tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tagKey = btn.getAttribute('data-tag-key');
        const label = tagLabelByKey(tagKey);
        if (label) onTagChange(label);
      });
    });

    const intensitySlider = container.querySelector('#intensityInput') as HTMLInputElement;
    if (intensitySlider) {
      intensitySlider.addEventListener('input', () => {
        onIntensityChange(parseInt(intensitySlider.value, 10));
      });
    }

    const noteBox = container.querySelector('#noteInput') as HTMLTextAreaElement;
    if (noteBox) {
      noteBox.addEventListener('input', () => {
        onNoteChange(noteBox.value);
      });
    }

    container.querySelector('#btnCancelModal')?.addEventListener('click', onCloseModal);
    container.querySelector('#modalBackdrop')?.addEventListener('click', e => {
      if (e.target === container.querySelector('#modalBackdrop')) {
        onCloseModal();
      }
    });

    container.querySelector('#btnSubmitModal')?.addEventListener('click', () => {
      handlers.onSubmitLog(selectedTag, selectedIntensity, noteText);
    });
  }
}
