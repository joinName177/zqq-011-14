import { MoodRecord, SynopticChartData } from '../core/models';
import {
  Locale,
  Messages,
  MESSAGES,
  MOOD_TAG_CODES,
  getTagMeta,
  formatCompactInt
} from '../core/i18n';
import { SynopticChartView } from '../core/localize';

export interface WeatherUIHandlers {
  onOpenLogModal: () => void;
  onResetData: () => void;
  onSubmitLog: (tag: string, intensity: number, note: string) => void;
  onSelectRecord: (record: MoodRecord) => void;
  onToggleLocale: () => void;
}

export function renderWeatherApp(
  container: HTMLElement,
  chartData: SynopticChartData,
  view: SynopticChartView,
  locale: Locale,
  isModalOpen: boolean,
  selectedTag: string,
  selectedIntensity: number,
  noteText: string,
  handlers: WeatherUIHandlers,
  onCloseModal: () => void,
  onTagChange: (tag: string) => void,
  onIntensityChange: (val: number) => void,
  onNoteChange: (val: string) => void
) {
  const t: Messages = MESSAGES[locale];
  const cur = view.current;
  const curMeta = getTagMeta(cur.tagCode, locale);
  const recordsById = new Map(chartData.records.map(r => [r.id, r]));

  const esc = (s: string) =>
    s.replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch] || ch));

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
        <text x="50" y="-30" fill="#00f0ff" font-size="10">${formatCompactInt(992, locale)} hPa</text>
        <text x="100" y="-60" fill="#00f0ff" font-size="10">${formatCompactInt(1004, locale)} hPa</text>
      </g>

      <!-- Center 2: High pressure ridge -->
      <g transform="translate(600, 150)">
        <ellipse cx="0" cy="0" rx="180" ry="100" fill="none" stroke="rgba(58, 134, 255, 0.3)" stroke-width="1.5" />
        <ellipse cx="0" cy="0" rx="110" ry="60" fill="none" stroke="rgba(58, 134, 255, 0.6)" stroke-width="1.5" />
        <circle cx="0" cy="0" r="16" fill="rgba(58, 134, 255, 0.2)" stroke="#3a86ff" stroke-width="2" />
        <text x="0" y="5" fill="#3a86ff" font-size="13" font-weight="bold" text-anchor="middle">H</text>
        <text x="-90" y="-40" fill="#3a86ff" font-size="10">${formatCompactInt(1020, locale)} hPa</text>
        <text x="-40" y="-10" fill="#3a86ff" font-size="10">${formatCompactInt(1028, locale)} hPa</text>
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
        <text x="0" y="5" font-size="12" text-anchor="middle">${curMeta.icon}</text>
        <rect x="-65" y="22" width="130" height="24" rx="4" fill="rgba(14,23,38,0.85)" stroke="rgba(0,240,255,0.3)" />
        <text x="0" y="38" fill="#e2eafc" font-size="11" font-weight="bold" text-anchor="middle">${t.chart.stationLabel}: ${cur.pressureLabel}</text>
      </g>
    </svg>
  `;

  const pressureState = cur.pressureHpa < 1000;
  const isLow = pressureState;

  container.innerHTML = `
    <div class="met-app" lang="${locale}">
      <header class="met-header">
        <div class="met-brand">
          <div class="radar-icon">📡</div>
          <div>
            <h1>${esc(t.app.title)}</h1>
            <p>${esc(t.app.subtitle)}</p>
          </div>
        </div>
        <div class="met-header-actions">
          <button class="btn-lang" id="btnToggleLocale" lang="${locale === 'zh' ? 'en' : 'zh'}">🌐 ${esc(t.app.langToggle)}</button>
          <button class="btn-reset" id="btnReset">${esc(t.app.reset)}</button>
          <button class="btn-record-mood" id="btnOpenLog">${esc(t.app.record)}</button>
        </div>
      </header>

      ${
        view.alerts.length > 0
          ? `
        <div class="alert-banner">
          <div class="alert-banner-left">
            <span class="alert-tag">${esc(view.alerts[0].warningLabel)}</span>
            <strong>${esc(view.alerts[0].title)}</strong>
            <span style="font-size:13px;color:var(--met-text);">${esc(view.alerts[0].cause)}</span>
          </div>
          <span style="font-size:12px;color:var(--met-muted);">${esc(view.alerts[0].issuedLabel)}</span>
        </div>
      `
          : ''
      }

      <div class="met-grid">
        <!-- Left: Synoptic Chart & Telemetry -->
        <main class="synoptic-box">
          <div class="box-title">
            <h2>${esc(t.chart.title)}</h2>
            <span style="font-size:12px;color:var(--met-muted);font-family:monospace;">
              ${esc(view.chartId)} · ${esc(view.generatedDateLabel)}
            </span>
          </div>

          <!-- Current Telemetry -->
          <div class="current-telemetry">
            <div class="telemetry-card">
              <div class="lbl">${esc(t.telemetry.barometer)}</div>
              <div class="val" style="color:var(--met-cyan);">${formatCompactInt(cur.pressureHpa, locale)} <span style="font-size:12px;">hPa</span></div>
              <div class="lbl">${isLow ? esc(t.pressure.lowConvection) : esc(t.pressure.highAnticyclone)}</div>
            </div>
            <div class="telemetry-card">
              <div class="lbl">${esc(t.telemetry.temperature)}</div>
              <div class="val" style="color:var(--met-gold);">${formatCompactInt(cur.temperatureC, locale)} <span style="font-size:12px;">°C</span></div>
              <div class="lbl">${esc(t.pressure.feelsGood)}</div>
            </div>
            <div class="telemetry-card">
              <div class="lbl">${esc(t.telemetry.humidity)}</div>
              <div class="val" style="color:var(--met-blue);">${formatCompactInt(cur.humidityPercent, locale)}%</div>
              <div class="lbl">${cur.humidityPercent > 80 ? esc(t.pressure.humidityHumid) : esc(t.pressure.humidityDry)}</div>
            </div>
            <div class="telemetry-card">
              <div class="lbl">${esc(t.telemetry.windField)}</div>
              <div class="val" style="color:#fff;">${esc(cur.windLabel)}</div>
              <div class="lbl">${cur.windSpeedLabel}</div>
            </div>
          </div>

          <!-- SVG Weather Map -->
          <div class="synoptic-map-wrap">
            ${isobarsSvg}
          </div>

          <div class="map-legend">
            <div class="legend-item"><div class="legend-color" style="background:#ff0054;"></div><span>${esc(t.legend.low)}</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#3a86ff;"></div><span>${esc(t.legend.high)}</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#00f0ff;"></div><span>${esc(t.legend.isobar)}</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#ffbe0b;"></div><span>${esc(t.legend.windVector)}</span></div>
          </div>

          <!-- Recent Days Sequence Strip -->
          <div class="timeline-section">
            <h3>${esc(t.timeline.title)}</h3>
            <div class="records-strip">
              ${view.records
                .map(
                  r => `
                <div class="record-pill ${r.id === cur.id ? 'active' : ''}" data-id="${r.id}">
                  <div class="pill-date">${esc(r.shortDateLabel)}</div>
                  <div class="pill-icon">${r.icon}</div>
                  <div class="pill-tag">${esc(r.tagLabel)}</div>
                  <div class="pill-pressure">${r.pressureLabel}</div>
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
            <h3>${esc(t.zones.title)}</h3>
            <div class="zone-list">
              ${view.zones
                .map(
                  z => `
                <div class="zone-card">
                  <div class="zone-header">
                    <span class="zone-name">${esc(z.name)}</span>
                    <span class="zone-ratio">${esc(z.ratioLabel)}</span>
                  </div>
                  <div class="zone-progress-bg">
                    <div class="zone-progress-fill" style="width: ${z.activeRatio}%"></div>
                  </div>
                  <div class="zone-desc">${esc(z.state)}</div>
                </div>
              `
                )
                .join('')}
            </div>
          </section>

          <!-- Monsoon Trends -->
          <section class="side-panel">
            <h3>${esc(t.monsoon.title)}</h3>
            <div class="monsoon-card">
              <div class="monsoon-vector-title">
                <span>🍃</span>
                <span>${esc(view.monsoon.vectorName)}</span>
              </div>
              <div class="monsoon-meta">
                <div>${esc(view.monsoon.originForceLabel)}${esc(view.monsoon.originSource)}</div>
                <div>${esc(view.monsoon.flowSpeedLabel)}${view.monsoon.flowSpeedKmhLabel}</div>
              </div>
              <div class="monsoon-forecast-box">
                <strong>${esc(view.monsoon.forecastTitle)}</strong>
                <div>${esc(view.monsoon.upcomingForecast)}</div>
              </div>
            </div>
          </section>

          <!-- Extreme Weather Alerts -->
          <section class="side-panel">
            <h3>${esc(t.alerts.title)}</h3>
            <div class="alerts-list">
              ${
                view.alerts.length > 0
                  ? view.alerts
                      .map(
                        a => `
                    <div class="alert-item ${esc(a.levelCode)}">
                      <div class="alert-title-row">
                        <span class="alert-name">${esc(a.title)}</span>
                        <span class="alert-level-badge" style="background:rgba(255,255,255,0.1);color:#fff;">${esc(a.levelLabel)}</span>
                      </div>
                      <div class="alert-cause">${esc(a.cause)}</div>
                      <div class="defense-guide-title">${esc(t.alerts.defenseTitle)}</div>
                      <ul class="defense-list">
                        ${a.defense.map(p => `<li>${esc(p)}</li>`).join('')}
                      </ul>
                    </div>
                  `
                      )
                      .join('')
                  : `
                    <div class="alert-empty">
                      ${esc(t.alerts.allClear)}
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
            <h3>${esc(t.modal.title)}</h3>

            <label class="modal-field-label">${esc(t.modal.chooseTag)}</label>
            <div class="tag-selector-grid">
              ${MOOD_TAG_CODES.map(code => {
                const m = getTagMeta(code, locale);
                return `
                <button type="button" class="tag-btn ${code === selectedTag ? 'active' : ''}" data-tag="${code}">
                  <span style="font-size:16px;">${m.icon}</span>
                  <span>${esc(m.label)}</span>
                </button>
              `;
              }).join('')}
            </div>

            <div class="form-group">
              <label><span id="intensityLabelText">${esc(t.modal.intensity(selectedIntensity))}</span></label>
              <input type="range" class="form-range" id="intensityInput" min="1" max="10" value="${selectedIntensity}" />
            </div>

            <div class="form-group">
              <label>${esc(t.modal.noteLabel)}</label>
              <textarea class="form-textarea" id="noteInput" placeholder="${esc(t.modal.notePlaceholder)}">${esc(noteText)}</textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-reset" id="btnCancelModal">${esc(t.modal.cancel)}</button>
              <button type="button" class="btn-record-mood" id="btnSubmitModal">${esc(t.modal.submit)}</button>
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
      if (id) {
        const domain = recordsById.get(id);
        if (domain) handlers.onSelectRecord(domain);
      }
    });
  });

  if (isModalOpen) {
    container.querySelectorAll('.tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        if (tag) onTagChange(tag);
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
