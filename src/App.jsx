import React, { useMemo, useState, useEffect, useCallback } from 'react';

const screens = [
  { id: 'editor', label: 'Editor' },
  { id: 'library', label: 'Asset Library' },
  { id: 'jobs', label: 'Batch Jobs' },
  { id: 'exports', label: 'Export Presets' },
  { id: 'versions', label: 'Version History' },
  { id: 'ai', label: 'AI Assist' },
  { id: 'review-link', label: 'Review Link' },
];

const modes = [
  { id: 'quick', label: 'Quick Mode' },
  { id: 'studio', label: 'Studio Mode' },
  { id: 'review', label: 'Review Mode' },
];

const modeContent = {
  quick: {
    label: 'Quick Workflow',
    title: 'Capture, explain, and send in one pass',
    inspector: 'Quick markup and guided communication',
    copy: 'Keep the UI light, keep the canvas central, and keep the share action always visible.',
    tokens: ['Step Capture', 'OCR Text Regions', 'Brand Theme', 'Review Link'],
  },
  studio: {
    label: 'Studio Workflow',
    title: 'Deep edits, variants, and background processing',
    inspector: 'Layer-safe editing with asset intelligence',
    copy: 'Progressively reveal richer tools like masks, relighting, presets, and batch exports without crowding the first-use experience.',
    tokens: ['Background Removal', 'Mask Stack', 'Variants', 'Batch Queue'],
  },
  review: {
    label: 'Review Workflow',
    title: 'Comment directly on the asset, not around it',
    inspector: 'Shared context for approvals and revisions',
    copy: 'The browser should make review links feel native: comments, pinned notes, compare states, and export decisions in one place.',
    tokens: ['Pinned Comments', 'Version Compare', 'Approval State', 'Share Preset'],
  },
};

const flowToMode = {
  capture: 'quick',
  product: 'studio',
  review: 'review',
};

const ToastCtx = React.createContext(() => {});
const I18nCtx = React.createContext({ lang: 'en', t: (k) => k });

const dict = {
  en: {
    'Editor': 'Editor', 'Asset Library': 'Asset Library', 'Batch Jobs': 'Batch Jobs',
    'Export Presets': 'Export Presets', 'Version History': 'Version History',
    'AI Assist': 'AI Assist', 'Review Link': 'Review Link',
    'Quick Mode': 'Quick', 'Studio Mode': 'Studio', 'Review Mode': 'Review',
    'Capture': 'Capture', 'Import': 'Import', 'Export JSON': 'Export JSON', 'Import JSON': 'Import JSON',
    'Quick Styles': 'Quick Styles', 'Tool Properties': 'Tool Properties', 'Effects': 'Effects',
    'Files': 'Files', 'Open': 'Open', 'Open local folder': 'Open local folder',
    'No folder opened.': 'No folder opened.', 'Flows': 'Flows',
    'Drop image here': 'Drop image here',
    'or click to browse · paste from clipboard · use Capture / Import': 'or click to browse · paste from clipboard · use Capture / Import',
    'Choose file': 'Choose file', 'Remove BG': 'Remove BG',
    'Undo': 'Undo', 'Redo': 'Redo', 'Clear': 'Clear', 'Export…': 'Export…', 'Apply': 'Apply',
    'Arrow': 'Arrow', 'Pen': 'Pen', 'Highlight': 'Highlight', 'Shape': 'Shape', 'Fill': 'Fill',
    'Callout': 'Callout', 'Step': 'Step', 'Blur': 'Blur', 'Text': 'Text', 'Mask': 'Mask',
    'Selection': 'Selection', 'Crop': 'Crop', 'Grab Text': 'Grab Text',
    'Color': 'Color', 'Opacity': 'Opacity', 'Width': 'Width', 'Style': 'Style',
    'Start size': 'Start size', 'End size': 'End size',
    'Light theme': 'Light theme', 'Dark theme': 'Dark theme',
    'Language': 'Language',
  },
  tr: {
    'Editor': 'Editör', 'Asset Library': 'Varlık Kütüphanesi', 'Batch Jobs': 'Toplu İşler',
    'Export Presets': 'Export Presetleri', 'Version History': 'Sürüm Geçmişi',
    'AI Assist': 'AI Yardım', 'Review Link': 'İnceleme Linki',
    'Quick Mode': 'Hızlı', 'Studio Mode': 'Stüdyo', 'Review Mode': 'İnceleme',
    'Capture': 'Yakala', 'Import': 'İçe Aktar', 'Export JSON': 'JSON Dışa', 'Import JSON': 'JSON İçe',
    'Quick Styles': 'Hızlı Stiller', 'Tool Properties': 'Araç Özellikleri', 'Effects': 'Efektler',
    'Files': 'Dosyalar', 'Open': 'Aç', 'Open local folder': 'Yerel klasör aç',
    'No folder opened.': 'Açık klasör yok.', 'Flows': 'Akışlar',
    'Drop image here': 'Resmi buraya bırak',
    'or click to browse · paste from clipboard · use Capture / Import': 'veya tıkla · yapıştır · Yakala / İçe Aktar kullan',
    'Choose file': 'Dosya seç', 'Remove BG': 'Arka Planı Kaldır',
    'Undo': 'Geri', 'Redo': 'İleri', 'Clear': 'Temizle', 'Export…': 'Dışa Aktar…', 'Apply': 'Uygula',
    'Arrow': 'Ok', 'Pen': 'Kalem', 'Highlight': 'Vurgu', 'Shape': 'Şekil', 'Fill': 'Doldur',
    'Callout': 'Balon', 'Step': 'Adım', 'Blur': 'Bulanık', 'Text': 'Metin', 'Mask': 'Maske',
    'Selection': 'Seçim', 'Crop': 'Kırp', 'Grab Text': 'Metni Al',
    'Color': 'Renk', 'Opacity': 'Opaklık', 'Width': 'Kalınlık', 'Style': 'Stil',
    'Start size': 'Başlangıç', 'End size': 'Bitiş',
    'Light theme': 'Açık tema', 'Dark theme': 'Koyu tema',
    'Language': 'Dil',
  },
};

function useI18n() { return React.useContext(I18nCtx); }

function App() {
  const [activeScreen, setActiveScreen] = useState('editor');
  const [activeMode, setActiveMode] = useState('quick');
  const [toast, setToast] = useState(null);
  const [loadedImage, setLoadedImage] = useState(null);
  const [publishedLink, setPublishedLink] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = useCallback((k) => dict[lang]?.[k] ?? k, [lang]);

  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  const fileInputRef = React.useRef(null);
  const activeModeContent = useMemo(() => modeContent[activeMode], [activeMode]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const notify = useCallback((msg) => {
    setToast({ msg, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const handleFlowSelect = (flow) => {
    setActiveMode(flowToMode[flow]);
    setActiveScreen('editor');
    notify(`Switched to ${flowToMode[flow]} mode`);
  };

  const handleImport = () => fileInputRef.current?.click();

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLoadedImage({ name: file.name, url, size: file.size });
    setActiveScreen('editor');
    notify(`Imported ${file.name}`);
    e.target.value = '';
  };

  const handleCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      notify('Screen capture unsupported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      stream.getTracks().forEach((t) => t.stop());
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      const url = URL.createObjectURL(blob);
      const name = `capture-${Date.now()}.png`;
      setLoadedImage({ name, url, size: blob.size });
      setActiveScreen('editor');
      notify('Captured screen');
    } catch (err) {
      if (err.name !== 'NotAllowedError') notify(`Capture failed: ${err.message}`);
    }
  };

  const handleShare = async () => {
    const link = publishedLink || `${location.origin}/review/${Math.random().toString(36).slice(2, 8)}`;
    try {
      await navigator.clipboard.writeText(link);
      notify('Link copied to clipboard');
    } catch {
      notify(link);
    }
  };

  const handlePublish = () => {
    const id = Math.random().toString(36).slice(2, 8);
    const link = `${location.origin}/review/${id}`;
    setPublishedLink(link);
    setActiveScreen('review-link');
    notify(`Published: ${link}`);
  };

  return (
    <ToastCtx.Provider value={notify}>
     <I18nCtx.Provider value={{ lang, t }}>
      <div className="app-shell">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />

        <header className="topbar compact">
          <div className="brand compact">
            <div className="brand-mark sm">F</div>
            <h1>Frameflow</h1>
          </div>

          <nav className="top-actions compact">
            <button className="ghost sm icon-btn" onClick={handleCapture}><Dot /> {t('Capture')}</button>
            <button className="ghost sm icon-btn" onClick={handleImport}><Dot /> {t('Import')}</button>
            <div className="seg-toggle">
              <button className={`seg-opt${theme === 'light' ? ' on' : ''}`} onClick={() => setTheme('light')} title={t('Light theme')}>☀</button>
              <button className={`seg-opt${theme === 'dark' ? ' on' : ''}`} onClick={() => setTheme('dark')} title={t('Dark theme')}>☾</button>
            </div>
            <div className="seg-toggle">
              <button className={`seg-opt${lang === 'en' ? ' on' : ''}`} onClick={() => setLang('en')}>EN</button>
              <button className={`seg-opt${lang === 'tr' ? ' on' : ''}`} onClick={() => setLang('tr')}>TR</button>
            </div>
            <button className="ghost sm" onClick={() => {
              if (activeScreen !== 'editor') setActiveScreen('editor');
              setTimeout(() => {
                if (typeof window.__fwExportJson === 'function') window.__fwExportJson();
                else notify('Open editor first');
              }, 60);
            }} title="Export project JSON">{'{ }'} {t('Export JSON')}</button>
            <button className="primary sm" onClick={() => {
              if (activeScreen !== 'editor') setActiveScreen('editor');
              setTimeout(() => {
                if (typeof window.__fwImportJson === 'function') window.__fwImportJson();
                else notify('Open editor first');
              }, 60);
            }} title="Import project JSON">{'{ }'} {t('Import JSON')}</button>
          </nav>
        </header>

        {activeScreen === 'editor' && (
          <EditorScreen
            activeMode={activeMode}
            content={activeModeContent}
            onFlowSelect={handleFlowSelect}
            loadedImage={loadedImage}
            setLoadedImage={setLoadedImage}
          />
        )}
        {activeScreen === 'library' && <LibraryScreen />}
        {activeScreen === 'jobs' && <JobsScreen />}
        {activeScreen === 'exports' && <ExportsScreen />}
        {activeScreen === 'versions' && <VersionsScreen />}
        {activeScreen === 'ai' && <AiScreen />}
        {activeScreen === 'review-link' && <ReviewScreen publishedLink={publishedLink} />}

        {toast && <div className="toast" key={toast.id}>{toast.msg}</div>}
      </div>
     </I18nCtx.Provider>
    </ToastCtx.Provider>
  );
}

function Dot() {
  return <span className="btn-dot" aria-hidden="true" />;
}

function useToast() {
  return React.useContext(ToastCtx);
}

function ToolBar({ tools, initial = 0, value, onSelect }) {
  const [internal, setInternal] = useState(typeof value === 'string' ? value : tools[initial]);
  const active = value !== undefined ? value : internal;
  const notify = useToast();
  return (
    <div className="tool-group">
      {tools.map((tool) => (
        <button
          key={tool}
          className={`tool${tool === active ? ' active' : ''}`}
          onClick={() => {
            if (value === undefined) setInternal(tool);
            notify(`${tool}`);
            onSelect?.(tool);
          }}
        >
          {tool}
        </button>
      ))}
    </div>
  );
}

const textQuickStyles = [
  { fill: '#d95f33', outline: '#fff', label: 'A' },
  { fill: '#2d8d4a', outline: '#fff', label: 'A' },
  { fill: '#2b6aad', outline: '#fff', label: 'A' },
  { fill: '#d7b74d', outline: '#fff', label: 'A' },
  { fill: '#b03030', outline: '#1f1b18', label: 'A' },
  { fill: '#177a3c', outline: '#1f1b18', label: 'A' },
  { fill: '#1e5a99', outline: '#1f1b18', label: 'A' },
  { fill: '#c79b2a', outline: '#1f1b18', label: 'A' },
  { fill: 'transparent', outline: '#1f1b18', label: 'A' },
  { fill: 'transparent', outline: '#6e6258', label: 'A' },
  { fill: 'transparent', outline: '#2d3947', label: 'A' },
  { fill: 'transparent', outline: '#b3a99c', label: 'A' },
];

function QuickStylesHighlight({ props, setProps }) {
  return (
    <section className="inspector-group qs-group">
      <div className="theme-row">
        <span>Theme:</span>
        <select defaultValue="Starter" className="dark-select">
          <option>Starter</option><option>Brand</option>
        </select>
        <button className="mini-btn">⚙</button>
      </div>
      <div className="hl-quick-grid">
        {highlightSwatches.map((c) => {
          const active = props.color === c;
          return (
            <button key={c} className={`hl-swatch${active ? ' active' : ''}`}
              onClick={() => setProps((p) => ({ ...p, color: c }))}
              style={{ background: c, opacity: 0.6 }}
              title={c}
            />
          );
        })}
        <button className="hl-swatch plus" title="New swatch">
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="2" y="2" width="28" height="28" rx="4" fill="#3a3a3a" stroke="#666" strokeDasharray="3 2" />
            <text x="16" y="22" textAnchor="middle" fontSize="18" fill="#fff">+</text>
          </svg>
        </button>
      </div>
    </section>
  );
}

function HighlightProperties({ props, setProps }) {
  const upd = (patch) => setProps((p) => ({ ...p, ...patch }));
  return (
    <>
      <div className="panel-header"><h3>Tool Properties</h3><span>?</span></div>
      <section className="inspector-group qs-group">
        <div className="tp-row">
          <div className="tp-col">
            <span className="tp-label">Color</span>
            <button className="tp-box" style={{ background: props.color }}>
              <input type="color" value={props.color} onChange={(e) => upd({ color: e.target.value })} />
            </button>
          </div>
          <div className="tp-col">
            <span className="tp-label">Shape</span>
            <select value={props.shape} onChange={(e) => upd({ shape: e.target.value })} className="dark-select tp-select">
              <option value="rect">Rectangle</option>
              <option value="free">Freeform</option>
            </select>
          </div>
        </div>
        <label className="tp-slider">
          <span>Opacity:</span>
          <input type="range" min="0" max="100" value={props.opacity} onChange={(e) => upd({ opacity: +e.target.value })} className="slider" />
          <span className="tp-num">%{props.opacity}</span>
        </label>
      </section>
    </>
  );
}

function QuickStylesPen({ props, setProps }) {
  return (
    <section className="inspector-group qs-group">
      <div className="theme-row">
        <span>Theme:</span>
        <select defaultValue="Starter" className="dark-select">
          <option>Starter</option><option>Brand</option>
        </select>
        <button className="mini-btn">⚙</button>
      </div>
      <div className="pen-quick-grid">
        {penSwatches.map((c) => {
          const active = props.color === c;
          return (
            <button key={c} className={`pen-swatch${active ? ' active' : ''}`}
              onClick={() => setProps((p) => ({ ...p, color: c }))}
              title={c}
            >
              <svg viewBox="0 0 40 40" width="100%" height="100%">
                <path d="M 4 26 Q 10 8, 16 20 T 28 18 T 38 12" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
              </svg>
            </button>
          );
        })}
        <button className="pen-swatch plus" title="New swatch">
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <rect x="2" y="2" width="28" height="28" rx="4" fill="#3a3a3a" stroke="#666" strokeDasharray="3 2" />
            <text x="16" y="22" textAnchor="middle" fontSize="18" fill="#fff">+</text>
          </svg>
        </button>
      </div>
    </section>
  );
}

function PenProperties({ props, setProps }) {
  const upd = (patch) => setProps((p) => ({ ...p, ...patch }));
  return (
    <>
      <div className="panel-header"><h3>Tool Properties</h3><span>?</span></div>
      <section className="inspector-group qs-group">
        <div className="tp-row">
          <div className="tp-col">
            <span className="tp-label">Color</span>
            <button className="tp-box" style={{ background: props.color, border: `4px solid ${props.color}` }}>
              <input type="color" value={props.color} onChange={(e) => upd({ color: e.target.value })} />
            </button>
          </div>
          <div className="tp-col">
            <span className="tp-label">Shadow ▾</span>
            <button className="tp-box shadow-box">⋮⋮</button>
          </div>
        </div>
        <label className="tp-slider">
          <span>Opacity:</span>
          <input type="range" min="0" max="100" value={props.opacity} onChange={(e) => upd({ opacity: +e.target.value })} className="slider" />
          <span className="tp-num">%{props.opacity}</span>
        </label>
        <label className="tp-slider">
          <span>Width:</span>
          <input type="range" min="1" max="30" value={props.width} onChange={(e) => upd({ width: +e.target.value })} className="slider" />
          <span className="tp-num">{props.width} pt</span>
        </label>
        <label className="tp-checkbox">
          <input type="checkbox" checked={props.editable} onChange={(e) => upd({ editable: e.target.checked })} />
          <span>Create Editable Line</span>
        </label>
        <label className="tp-checkbox">
          <input type="checkbox" checked={props.smooth} onChange={(e) => upd({ smooth: e.target.checked })} />
          <span>Smooth Curves</span>
        </label>
      </section>
    </>
  );
}

function ExportModal({ image, annotations, filters, style, onClose, notify }) {
  const [format, setFormat] = React.useState('png');
  const [quality, setQuality] = React.useState(92);
  const [bgFill, setBgFill] = React.useState('transparent');
  const [exporting, setExporting] = React.useState(false);
  const [origW, origH] = [0, 0];
  const [dims, setDims] = React.useState({ w: 0, h: 0, natural: { w: 0, h: 0 } });
  const [lockRatio, setLockRatio] = React.useState(true);
  const [customRatio, setCustomRatio] = React.useState('auto');
  const [dpi, setDpi] = React.useState(72);
  const [unit, setUnit] = React.useState('px');

  React.useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight, natural: { w: img.naturalWidth, h: img.naturalHeight } });
    img.src = image.url;
  }, [image]);

  const aspect = React.useMemo(() => {
    if (customRatio === 'auto') return dims.natural.w / dims.natural.h || 1;
    const [a, b] = customRatio.split(':').map(Number);
    return a / b;
  }, [customRatio, dims.natural]);

  const setW = (w) => {
    w = Math.max(1, +w || 0);
    setDims((d) => ({ ...d, w, h: lockRatio ? Math.round(w / aspect) : d.h }));
  };
  const setH = (h) => {
    h = Math.max(1, +h || 0);
    setDims((d) => ({ ...d, h, w: lockRatio ? Math.round(h * aspect) : d.w }));
  };

  const resetSize = () => setDims((d) => ({ ...d, w: d.natural.w, h: d.natural.h }));

  const scale = dims.natural.w ? dims.w / dims.natural.w : 1;

  const run = async () => {
    setExporting(true);
    try {
      if (format === 'svg') {
        await exportSVG(image, annotations, filters, style, { width: dims.w, height: dims.h, bgFill });
      } else if (format === 'pdf') {
        await exportPDF(image, annotations, filters, style, { width: dims.w, height: dims.h, bgFill, dpi });
      } else {
        await exportCanvas(image, annotations, filters, style, { format, quality: quality / 100, scale, bgFill, dpi });
      }
      notify(`Exported ${format.toUpperCase()}`);
      onClose();
    } catch (e) { notify(e.message); }
    setExporting(false);
  };

  const toInches = (px) => (px / dpi).toFixed(2);
  const toCm = (px) => (px / dpi * 2.54).toFixed(2);
  const displayW = unit === 'px' ? dims.w : (unit === 'in' ? toInches(dims.w) : toCm(dims.w));
  const displayH = unit === 'px' ? dims.h : (unit === 'in' ? toInches(dims.h) : toCm(dims.h));

  const fromUnit = (v) => {
    v = +v || 0;
    if (unit === 'px') return v;
    if (unit === 'in') return Math.round(v * dpi);
    return Math.round(v / 2.54 * dpi);
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-window md" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-titlebar">
          <div className="modal-traffic"><span className="tl tl-r" /><span className="tl tl-y" /><span className="tl tl-g" /></div>
          <div className="modal-title">Export Image</div>
          <div className="modal-spacer" />
        </div>
        <div className="modal-body">
          <label className="mod-row"><span>Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="dark-select">
              <option value="png">PNG (lossless, alpha)</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
              <option value="svg">SVG (vector, annotations)</option>
              <option value="pdf">PDF</option>
            </select>
          </label>

          {(format === 'jpeg' || format === 'webp') && (
            <label className="mod-row"><span>Quality {quality}%</span>
              <input type="range" min="1" max="100" value={quality} onChange={(e) => setQuality(+e.target.value)} className="slider" />
            </label>
          )}

          <div className="mod-row"><span>Size</span>
            <div className="size-row">
              <input type="number" min="1" value={displayW} onChange={(e) => setW(fromUnit(e.target.value))} className="num-input" />
              <span className="x">×</span>
              <input type="number" min="1" value={displayH} onChange={(e) => setH(fromUnit(e.target.value))} className="num-input" />
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="dark-select unit-sel">
                <option value="px">px</option>
                <option value="in">in</option>
                <option value="cm">cm</option>
              </select>
              <button className={`mini-btn lock-btn${lockRatio ? ' on' : ''}`} onClick={() => setLockRatio((v) => !v)} title="Lock aspect ratio">{lockRatio ? '🔒' : '🔓'}</button>
            </div>
          </div>

          <div className="mod-row"><span>Aspect</span>
            <div className="seg-row">
              {['auto', '1:1', '4:3', '3:2', '16:9', '9:16'].map((r) => (
                <button key={r} className={`seg-btn${customRatio === r ? ' active' : ''}`} onClick={() => setCustomRatio(r)}>{r}</button>
              ))}
            </div>
          </div>

          <div className="mod-row"><span>DPI</span>
            <div className="seg-row">
              {[72, 96, 150, 300, 600].map((d) => (
                <button key={d} className={`seg-btn${dpi === d ? ' active' : ''}`} onClick={() => setDpi(d)}>{d}</button>
              ))}
            </div>
          </div>

          <div className="mod-row"><span>Presets</span>
            <div className="preset-chips">
              <button className="chip" onClick={resetSize}>Original ({dims.natural.w}×{dims.natural.h})</button>
              <button className="chip" onClick={() => setDims((d) => ({ ...d, w: Math.round(d.natural.w * 0.5), h: Math.round(d.natural.h * 0.5) }))}>50%</button>
              <button className="chip" onClick={() => setDims((d) => ({ ...d, w: d.natural.w * 2, h: d.natural.h * 2 }))}>2×</button>
              <button className="chip" onClick={() => setDims({ w: 2480, h: 3508, natural: dims.natural })}>A4 300dpi</button>
              <button className="chip" onClick={() => setDims({ w: 1920, h: 1080, natural: dims.natural })}>1080p</button>
              <button className="chip" onClick={() => setDims({ w: 1200, h: 630, natural: dims.natural })}>OG 1200×630</button>
            </div>
          </div>

          <label className="mod-row"><span>Background</span>
            <div className="seg-row">
              <button className={`seg-btn${bgFill === 'transparent' ? ' active' : ''}`} onClick={() => setBgFill('transparent')}>Transparent</button>
              <button className={`seg-btn${bgFill === 'white' ? ' active' : ''}`} onClick={() => setBgFill('white')}>White</button>
              <button className={`seg-btn${bgFill === 'black' ? ' active' : ''}`} onClick={() => setBgFill('black')}>Black</button>
            </div>
          </label>
        </div>
        <div className="modal-footer">
          <div className="export-info">{dims.w}×{dims.h}px @ {dpi}dpi {format === 'pdf' ? `(${toInches(dims.w)}×${toInches(dims.h)}in)` : ''}</div>
          <div className="modal-spacer" />
          <button className="modal-btn" onClick={onClose}>Cancel</button>
          <button className="modal-btn primary" onClick={run} disabled={exporting}>{exporting ? 'Exporting…' : `Export ${format.toUpperCase()}`}</button>
        </div>
      </div>
    </div>
  );
}

async function exportSVG(image, annotations, filters, style, { width, height, bgFill }) {
  const img = new Image();
  img.src = image.url;
  await new Promise((r) => { img.onload = r; });
  const imgScale = width / img.naturalWidth;

  // Embed image as data URL
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d').drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');

  const bg = bgFill !== 'transparent' ? `<rect width="${width}" height="${height}" fill="${bgFill}"/>` : '';
  const W = width, H = height;

  const annSvg = annotations.map((a) => {
    const c = a.color || style.color;
    const sw = (a.stroke || 4);
    if (a.kind === 'arrow') return `<line x1="${a.x1 * W}" y1="${a.y1 * H}" x2="${a.x2 * W}" y2="${a.y2 * H}" stroke="${c}" stroke-width="${sw}"/>`;
    if (a.kind === 'step') return `<g><circle cx="${a.x * W}" cy="${a.y * H}" r="${W * 0.022}" fill="${c}"/><text x="${a.x * W}" y="${a.y * H + W * 0.012}" text-anchor="middle" font-size="${W * 0.028}" fill="#fff" font-weight="700">${a.n}</text></g>`;
    if (a.kind === 'text') return `<text x="${a.x * W}" y="${a.y * H}" fill="${c}" font-size="${W * 0.028}" font-weight="600">${escapeXml(a.text)}</text>`;
    if (a.kind === 'rect') return `<rect x="${a.x * W}" y="${a.y * H}" width="${a.w * W}" height="${a.h * H}" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
    if (a.kind === 'ellipse') return `<ellipse cx="${(a.x + a.w / 2) * W}" cy="${(a.y + a.h / 2) * H}" rx="${a.w / 2 * W}" ry="${a.h / 2 * H}" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
    if (a.kind === 'pen' || a.kind === 'highlight') {
      const d = a.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * W} ${p.y * H}`).join(' ');
      const o = a.kind === 'highlight' ? 0.4 : 1;
      const w = a.kind === 'highlight' ? sw * 3 : sw;
      return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${o}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (a.kind === 'blur' || a.kind === 'mask') return `<rect x="${a.x * W}" y="${a.y * H}" width="${a.w * W}" height="${a.h * H}" fill="${c}" opacity="0.3"/>`;
    return '';
  }).join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${bg}
<image xlink:href="${dataUrl}" width="${width}" height="${height}" preserveAspectRatio="none"/>
${annSvg}
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${image.name.replace(/\.[^.]+$/, '')}.svg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeXml(s) { return String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]); }

async function exportPDF(image, annotations, filters, style, { width, height, bgFill, dpi }) {
  const scale = width / (await imgDims(image.url)).w;
  await exportCanvas(image, annotations, filters, style, { format: 'png', quality: 1, scale, bgFill });
  // After PNG export as source, build PDF via jsPDF
  try {
    const jspdf = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm');
    const { jsPDF } = jspdf;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (bgFill !== 'transparent') { ctx.fillStyle = bgFill; ctx.fillRect(0, 0, width, height); }
    const img = new Image();
    img.src = image.url;
    await new Promise((r) => { img.onload = r; });
    ctx.drawImage(img, 0, 0, width, height);
    // Annotations
    await drawAnnotations(ctx, annotations, style, width, height);
    const dataUrl = canvas.toDataURL('image/png');

    const inW = width / dpi;
    const inH = height / dpi;
    const pdf = new jsPDF({ orientation: inW > inH ? 'landscape' : 'portrait', unit: 'in', format: [inW, inH] });
    pdf.addImage(dataUrl, 'PNG', 0, 0, inW, inH);
    pdf.save(`${image.name.replace(/\.[^.]+$/, '')}.pdf`);
  } catch (e) { throw new Error(`PDF failed: ${e.message}`); }
}

async function imgDims(url) {
  const img = new Image();
  img.src = url;
  await new Promise((r) => { img.onload = r; });
  return { w: img.naturalWidth, h: img.naturalHeight };
}

async function drawAnnotations(ctx, annotations, style, W, H) {
  for (const a of annotations) {
    const c = a.color || style.color;
    const sw = a.stroke || 4;
    ctx.lineWidth = sw;
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    if (a.kind === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(a.x1 * W, a.y1 * H);
      ctx.lineTo(a.x2 * W, a.y2 * H);
      ctx.stroke();
    } else if (a.kind === 'rect') {
      ctx.strokeRect(a.x * W, a.y * H, a.w * W, a.h * H);
    } else if (a.kind === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse((a.x + a.w / 2) * W, (a.y + a.h / 2) * H, a.w / 2 * W, a.h / 2 * H, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (a.kind === 'text') {
      ctx.font = `600 ${W * 0.028}px Inter, sans-serif`;
      ctx.fillText(a.text, a.x * W, a.y * H);
    } else if (a.kind === 'pen' || a.kind === 'highlight') {
      ctx.save();
      if (a.kind === 'highlight') { ctx.globalAlpha = 0.4; ctx.lineWidth = sw * 3; }
      ctx.beginPath();
      a.points.forEach((p, i) => {
        const x = p.x * W, y = p.y * H;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }
  }
}

async function runGrabText(image, setOcrState, notify) {
  setOcrState({ loading: true, text: '', progress: 0 });
  notify('Running OCR...');
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/tesseract.js@5/+esm');
    const Tesseract = mod.default || mod;
    const result = await Tesseract.recognize(image.url, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setOcrState((s) => ({ ...(s || {}), loading: true, text: '', progress: Math.round(m.progress * 100) }));
        }
      },
    });
    setOcrState({ loading: false, text: result.data.text || '(no text found)', progress: 100 });
  } catch (e) {
    setOcrState({ loading: false, text: `OCR failed: ${e.message}`, progress: 0, error: true });
  }
}

function GrabTextModal({ state, onClose, notify }) {
  const [plain, setPlain] = React.useState(true);
  const text = plain ? state.text.replace(/\n{3,}/g, '\n\n').trim() : state.text;
  const copyAll = async () => {
    try { await navigator.clipboard.writeText(text); notify('Text copied'); } catch (e) { notify(e.message); }
  };
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-window" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-titlebar">
          <div className="modal-traffic">
            <span className="tl tl-r" />
            <span className="tl tl-y" />
            <span className="tl tl-g" />
          </div>
          <div className="modal-title">Grab Text Results</div>
          <div className="modal-spacer" />
        </div>
        <div className="modal-body">
          {state.loading ? (
            <div className="ocr-loading">Recognizing text... {state.progress}%
              <div className="ocr-bar"><div style={{ width: `${state.progress}%` }} /></div>
            </div>
          ) : (
            <textarea readOnly value={text} className="ocr-textarea" />
          )}
        </div>
        <div className="modal-footer">
          <label className="modal-check">
            <input type="checkbox" checked={plain} onChange={(e) => setPlain(e.target.checked)} />
            <span>Make Plain Text</span>
          </label>
          <div className="modal-spacer" />
          <button className="modal-btn" onClick={onClose}>Close</button>
          <button className="modal-btn primary" onClick={copyAll} disabled={state.loading}>Copy All</button>
        </div>
      </div>
    </div>
  );
}

function QuickStylesArrow({ arrowProps, setArrowProps }) {
  return (
    <section className="inspector-group qs-group">
      <div className="theme-row">
        <span>Theme:</span>
        <select defaultValue="Starter" className="dark-select">
          <option>Starter</option>
          <option>Brand</option>
        </select>
        <button className="mini-btn">⚙</button>
      </div>
      <div className="arrow-quick-grid">
        {arrowSwatches.map((s, i) => {
          const active = arrowProps.color === s.color && arrowProps.lineStyle === s.style;
          const hasEnd = s.heads === 'end' || s.heads === 'both-dot';
          const hasStartDot = s.heads === 'both-dot';
          const markerId = `aqh-${i}`;
          const dotId = `aqd-${i}`;
          const dashArray = s.style === 'dashed' ? '4 3' : '';
          return (
            <button
              key={i}
              className={`arrow-swatch${active ? ' active' : ''}`}
              onClick={() => setArrowProps((p) => ({
                ...p,
                color: s.color,
                lineStyle: s.style,
                startHead: hasStartDot ? 'dot' : 'none',
                endHead: hasEnd ? 'arrow' : (s.heads === 'both-dot' ? 'dot' : 'none'),
              }))}
              title={s.color}
            >
              <svg viewBox="0 0 44 44" width="40" height="40">
                <defs>
                  <marker id={markerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill={s.color} />
                  </marker>
                  <marker id={dotId} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                    <circle cx="2" cy="2" r="2" fill={s.color} />
                  </marker>
                </defs>
                <line
                  x1="6" y1="36" x2="36" y2="8"
                  stroke={s.color}
                  strokeWidth="3"
                  strokeDasharray={dashArray}
                  strokeLinecap="round"
                  markerEnd={hasEnd ? `url(#${markerId})` : (s.heads === 'both-dot' ? `url(#${dotId})` : undefined)}
                  markerStart={hasStartDot ? `url(#${dotId})` : undefined}
                />
              </svg>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ArrowProperties({ props, setProps }) {
  const upd = (patch) => setProps((p) => ({ ...p, ...patch }));
  return (
    <>
      <div className="panel-header">
        <h3>Tool Properties</h3>
        <span>?</span>
      </div>
      <section className="inspector-group qs-group">
        <div className="tp-row">
          <div className="tp-col">
            <span className="tp-label">Color</span>
            <button className="tp-box" style={{ background: props.color, border: `4px solid ${props.color}` }}>
              <input type="color" value={props.color} onChange={(e) => upd({ color: e.target.value })} />
            </button>
          </div>
          <div className="tp-col">
            <span className="tp-label">Shadow ▾</span>
            <button className="tp-box shadow-box">⋮⋮</button>
          </div>
        </div>

        <label className="tp-slider">
          <span>Opacity:</span>
          <input type="range" min="0" max="100" value={props.opacity} onChange={(e) => upd({ opacity: +e.target.value })} className="slider" />
          <span className="tp-num">%{props.opacity}</span>
        </label>

        <label className="tp-slider">
          <span>Width:</span>
          <input type="range" min="1" max="40" value={props.width} onChange={(e) => upd({ width: +e.target.value })} className="slider" />
          <span className="tp-num">{props.width} pt</span>
        </label>

        <label className="tp-slider">
          <span>Style:</span>
          <select value={props.lineStyle} onChange={(e) => upd({ lineStyle: e.target.value })} className="dark-select">
            <option value="solid">━━━</option>
            <option value="dashed">- - -</option>
            <option value="dotted">· · ·</option>
          </select>
          <select value={props.endHead} onChange={(e) => upd({ endHead: e.target.value })} className="dark-select">
            <option value="arrow">➔</option>
            <option value="dot">●</option>
            <option value="none">—</option>
          </select>
        </label>

        <label className="tp-slider">
          <span>Start size:</span>
          <input type="range" min="1" max="10" value={props.startSize} onChange={(e) => upd({ startSize: +e.target.value })} className="slider" />
          <span className="tp-num">{props.startSize}</span>
        </label>

        <label className="tp-slider">
          <span>End size:</span>
          <input type="range" min="1" max="10" value={props.endSize} onChange={(e) => upd({ endSize: +e.target.value })} className="slider" />
          <span className="tp-num">{props.endSize}</span>
        </label>
      </section>
    </>
  );
}

function SelectionProperties({ props, setProps }) {
  const upd = (patch) => setProps((p) => ({ ...p, ...patch }));
  const shapes = [
    { id: 'rect', icon: <rect x="5" y="7" width="22" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" /> },
    { id: 'ellipse', icon: <ellipse cx="16" cy="16" rx="11" ry="9" fill="currentColor" opacity="0.9" /> },
    { id: 'polygon', icon: <polygon points="16,5 27,12 24,24 8,24 5,12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" /> },
    { id: 'lasso', icon: <path d="M 8 8 Q 20 4 26 12 Q 30 22 18 25 Q 6 24 6 16 Q 6 12 10 10 L 13 27" fill="none" stroke="currentColor" strokeWidth="1.8" /> },
  ];
  return (
    <>
      <div className="panel-header">
        <h3>Tool Properties</h3>
        <span>?</span>
      </div>
      <section className="inspector-group qs-group">
        <div className="sel-shape-row">
          {shapes.map((s) => (
            <button
              key={s.id}
              className={`sel-shape-btn${props.shape === s.id ? ' active' : ''}`}
              onClick={() => upd({ shape: s.id })}
              title={s.id}
            >
              <svg viewBox="0 0 32 32" width="30" height="30">{s.icon}</svg>
            </button>
          ))}
        </div>

        <label className="tp-toggle-row">
          <span>Snap to Object</span>
          <button
            className={`toggle-switch${props.snap ? ' on' : ''}`}
            onClick={() => upd({ snap: !props.snap })}
            aria-pressed={props.snap}
          >
            <span className="toggle-dot" />
          </button>
        </label>

        <div className="bg-fill-block">
          <p className="tp-label center">Background Fill:</p>
          <div className="bg-fill-row">
            <button
              className={`bg-fill-btn${props.bgFill === 'transparent' ? ' active' : ''}`}
              onClick={() => upd({ bgFill: 'transparent' })}
            >
              Transparent
            </button>
            <button
              className={`bg-fill-btn${props.bgFill === 'auto' ? ' active' : ''}`}
              onClick={() => upd({ bgFill: 'auto' })}
            >
              Auto-Fill
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function QuickStylesFill({ fillProps, setFillProps }) {
  return (
    <section className="inspector-group qs-group">
      <div className="theme-row">
        <span>Theme:</span>
        <select defaultValue="Starter" className="dark-select">
          <option>Starter</option>
          <option>Brand</option>
        </select>
        <button className="mini-btn">⚙</button>
      </div>
      <div className="fill-quick-grid">
        {fillSwatches.map((c, i) => {
          if (c === null) {
            return (
              <button key={i} className="fill-swatch plus" title="New swatch">
                <svg viewBox="0 0 32 32" width="32" height="32">
                  <rect x="2" y="2" width="28" height="28" rx="4" fill="#3a3a3a" stroke="#666" strokeDasharray="3 2" />
                  <text x="16" y="22" textAnchor="middle" fontSize="18" fill="#fff">+</text>
                </svg>
              </button>
            );
          }
          const active = fillProps.color === c;
          return (
            <button
              key={i}
              className={`fill-swatch${active ? ' active' : ''}`}
              onClick={() => setFillProps((p) => ({ ...p, color: c }))}
              title={c}
            >
              <svg viewBox="0 0 32 32" width="32" height="32">
                <path d="M 8 6 L 20 14 L 14 22 L 6 18 Z" fill={c} stroke="#1f1b18" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M 14 22 L 16 26 L 14 28 L 12 26 Z" fill={c} stroke="#1f1b18" strokeWidth="1" />
              </svg>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FillProperties({ props, setProps, pickColor }) {
  const upd = (patch) => setProps((p) => ({ ...p, ...patch }));
  return (
    <>
      <div className="panel-header">
        <h3>Tool Properties</h3>
        <span>?</span>
      </div>
      <section className="inspector-group qs-group">
        <div className="tp-row fill-tp-row">
          <div className="tp-col">
            <span className="tp-label">Eyedropper</span>
            <button className="tp-box eyedropper-box" onClick={pickColor} title="Pick color">⌖</button>
          </div>
          <div className="tp-col">
            <span className="tp-label">Fill</span>
            <button className="tp-box" style={{ background: props.color }}>
              <input type="color" value={props.color} onChange={(e) => upd({ color: e.target.value })} />
            </button>
          </div>
        </div>

        <label className="tp-slider">
          <span>Tolerance:</span>
          <input type="range" min="0" max="100" value={props.tolerance} onChange={(e) => upd({ tolerance: +e.target.value })} className="slider" />
          <span className="tp-num">%{props.tolerance}</span>
        </label>

        <label className="tp-slider">
          <span>Opacity:</span>
          <input type="range" min="0" max="100" value={props.opacity} onChange={(e) => upd({ opacity: +e.target.value })} className="slider" />
          <span className="tp-num">%{props.opacity}</span>
        </label>

        <label className="tp-checkbox">
          <input type="checkbox" checked={props.globalFill} onChange={(e) => upd({ globalFill: e.target.checked })} />
          <span>Global Fill</span>
        </label>
      </section>
    </>
  );
}

function QuickStylesShape({ shapeProps, setShapeProps }) {
  return (
    <section className="inspector-group qs-group">
      <div className="theme-row">
        <span>Theme:</span>
        <select defaultValue="Starter" className="dark-select">
          <option>Starter</option>
          <option>Brand</option>
        </select>
        <button className="mini-btn">⚙</button>
      </div>
      <div className="shape-quick-grid">
        {shapeSwatches.map((s, i) => {
          const active = shapeProps.variant === s.variant && shapeProps.outlineColor === s.outline && shapeProps.fillMode === (s.fill === 'transparent' ? 'none' : 'solid');
          return (
            <button
              key={i}
              className={`shape-swatch${active ? ' active' : ''}`}
              onClick={() => setShapeProps((p) => ({
                ...p,
                variant: s.variant,
                outlineColor: s.outline,
                fillMode: s.fill === 'transparent' ? 'none' : 'solid',
                fillColor: s.fill === 'transparent' ? p.fillColor : s.fill,
              }))}
              title={s.variant}
            >
              <svg viewBox="0 0 32 32" width="26" height="26">
                {s.variant === 'rect' && <rect x="4" y="6" width="24" height="20" fill={s.fill} stroke={s.outline} strokeWidth="3" />}
                {s.variant === 'ellipse' && <ellipse cx="16" cy="16" rx="12" ry="10" fill={s.fill} stroke={s.outline} strokeWidth="3" />}
                {s.variant === 'arrow-shape' && <path d="M 4 11 L 18 11 L 18 6 L 28 16 L 18 26 L 18 21 L 4 21 Z" fill={s.fill} stroke={s.outline} strokeWidth="3" strokeLinejoin="round" />}
              </svg>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ShapeProperties({ props, setProps }) {
  const upd = (patch) => setProps((p) => ({ ...p, ...patch }));
  return (
    <>
      <div className="panel-header">
        <h3>Tool Properties</h3>
        <span>?</span>
      </div>
      <section className="inspector-group qs-group">
        <div className="tp-row">
          <div className="tp-col">
            <span className="tp-label">Fill</span>
            <button
              className={`tp-box${props.fillMode === 'none' ? ' checker' : ''}`}
              style={props.fillMode === 'solid' ? { background: props.fillColor || '#fff' } : {}}
              onClick={() => upd({ fillMode: props.fillMode === 'solid' ? 'none' : 'solid' })}
            >
              {props.fillMode === 'solid' && <input type="color" value={props.fillColor || '#ffffff'} onChange={(e) => upd({ fillColor: e.target.value })} />}
            </button>
          </div>
          <div className="tp-col">
            <span className="tp-label">Outline</span>
            <button className="tp-box outline-box" style={{ borderColor: props.outlineColor }}>
              <input type="color" value={props.outlineColor} onChange={(e) => upd({ outlineColor: e.target.value })} />
            </button>
          </div>
          <div className="tp-col">
            <span className="tp-label">Shape</span>
            <select value={props.variant} onChange={(e) => upd({ variant: e.target.value })} className="dark-select tp-select">
              <option value="rect">Rectangle</option>
              <option value="ellipse">Ellipse</option>
              <option value="arrow-shape">Arrow</option>
            </select>
          </div>
          <div className="tp-col">
            <span className="tp-label">Shadow ▾</span>
            <button className="tp-box shadow-box">⋮⋮</button>
          </div>
        </div>

        <label className="tp-slider">
          <span>Opacity:</span>
          <input type="range" min="0" max="100" value={props.opacity} onChange={(e) => upd({ opacity: +e.target.value })} className="slider" />
          <span className="tp-num">%{props.opacity}</span>
        </label>

        <label className="tp-slider">
          <span>Line width:</span>
          <input type="range" min="0" max="30" value={props.lineWidth} onChange={(e) => upd({ lineWidth: +e.target.value })} className="slider" />
          <span className="tp-num">{props.lineWidth} pt</span>
        </label>

        <label className="tp-slider">
          <span>Line style:</span>
          <select value={props.lineStyle} onChange={(e) => upd({ lineStyle: e.target.value })} className="dark-select">
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </label>
      </section>
    </>
  );
}

function QuickStylesText({ activeTool, color, setStyle, onApply }) {
  return (
    <section className="inspector-group qs-group">
      <div className="theme-row">
        <span>Theme:</span>
        <select defaultValue="Starter" className="dark-select">
          <option>Starter</option>
          <option>Brand</option>
          <option>Docs</option>
        </select>
        <button className="mini-btn">⚙</button>
      </div>
      <div className="text-quick-grid">
        {textQuickStyles.map((s, i) => (
          <button
            key={i}
            className="tq-swatch"
            style={{
              background: activeTool === 'Callout' ? s.fill : 'transparent',
              color: s.fill === 'transparent' ? s.outline : '#fff',
              borderColor: s.outline,
            }}
            onClick={() => setStyle((st) => ({ ...st, color: s.fill === 'transparent' ? s.outline : s.fill }))}
            title={`Apply ${s.fill}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function ToolProperties({ tool, props, setProps, color, setColor, pickColor, swapColors }) {
  const [advanced, setAdvanced] = React.useState(true);
  const upd = (patch) => setProps((p) => ({ ...p, ...patch }));
  return (
    <>
      <div className="panel-header">
        <h3>Tool Properties</h3>
        <span>?</span>
      </div>

      <section className="inspector-group qs-group">
        <div className="tp-row">
          <div className="tp-col">
            <span className="tp-label">Fill</span>
            <button className="tp-box" style={{ background: color }}>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </button>
          </div>
          {tool === 'Callout' && (
            <div className="tp-col">
              <span className="tp-label">Outline</span>
              <button className="tp-box outline-box">
                <input type="color" value="#ffffff" readOnly />
              </button>
            </div>
          )}
          {tool === 'Callout' && (
            <div className="tp-col">
              <span className="tp-label">Shape</span>
              <button className="tp-box shape-box">▭</button>
            </div>
          )}
          <div className="tp-col">
            <span className="tp-label">Shadow ▾</span>
            <button className="tp-box shadow-box">⋮⋮</button>
          </div>
        </div>

        <select className="dark-select" value={props.font} onChange={(e) => upd({ font: e.target.value })}>
          <option>Inter</option>
          <option>Trebuchet MS</option>
          <option>Helvetica</option>
          <option>Georgia</option>
          <option>Source Serif 4</option>
          <option>JetBrains Mono</option>
        </select>

        <select className="dark-select" value={props.weight} onChange={(e) => upd({ weight: e.target.value, bold: e.target.value === 'Bold' })}>
          <option>Regular</option>
          <option>Bold</option>
          <option>Italic</option>
          <option>Light</option>
        </select>

        <label className="tp-slider">
          <span>Font size:</span>
          <input type="range" min="8" max="72" value={props.fontSize} onChange={(e) => upd({ fontSize: +e.target.value })} className="slider" />
          <span className="tp-num">{props.fontSize} pt</span>
        </label>

        <label className="tp-slider">
          <span>Line width:</span>
          <input type="range" min="0" max="20" value={props.lineWidth} onChange={(e) => upd({ lineWidth: +e.target.value })} className="slider" />
          <span className="tp-num">{props.lineWidth} pt</span>
        </label>

        <button className="tp-toggle" onClick={() => setAdvanced((v) => !v)}>
          {advanced ? '▾' : '▸'} Advanced
        </button>

        {advanced && (
          <>
            <div className="tp-btn-row">
              <button className={`tp-btn${props.underline ? ' active' : ''}`} onClick={() => upd({ underline: !props.underline })} title="Underline"><u>U</u></button>
              <button className="tp-btn" title="Strike"><s>T</s></button>
              <span className="divider" />
              <button className={`tp-btn${props.align === 'left' ? ' active' : ''}`} onClick={() => upd({ align: 'left' })}>⇤</button>
              <button className={`tp-btn${props.align === 'center' ? ' active' : ''}`} onClick={() => upd({ align: 'center' })}>≡</button>
              <button className={`tp-btn${props.align === 'right' ? ' active' : ''}`} onClick={() => upd({ align: 'right' })}>⇥</button>
              <span className="divider" />
              <button className={`tp-btn${props.valign === 'top' ? ' active' : ''}`} onClick={() => upd({ valign: 'top' })}>⤒</button>
              <button className={`tp-btn${props.valign === 'middle' ? ' active' : ''}`} onClick={() => upd({ valign: 'middle' })}>↕</button>
              <button className={`tp-btn${props.valign === 'bottom' ? ' active' : ''}`} onClick={() => upd({ valign: 'bottom' })}>⤓</button>
            </div>

            <label className="tp-slider">
              <span>Opacity:</span>
              <input type="range" min="0" max="100" value={props.opacity} onChange={(e) => upd({ opacity: +e.target.value })} className="slider" />
              <span className="tp-num">%{props.opacity}</span>
            </label>

            {tool === 'Callout' && (
              <label className="tp-slider">
                <span>Padding:</span>
                <input type="range" min="0" max="40" value={props.padding} onChange={(e) => upd({ padding: +e.target.value })} className="slider" />
                <span className="tp-num">{props.padding} pt</span>
              </label>
            )}

            <label className="tp-slider">
              <span>Line spacing:</span>
              <input type="range" min="0" max="40" value={props.lineSpacing} onChange={(e) => upd({ lineSpacing: +e.target.value })} className="slider" />
              <span className="tp-num">{props.lineSpacing} pt</span>
            </label>
          </>
        )}
      </section>
    </>
  );
}

function FloatingPopup({ x, y, initial, placeholder, onCommit, onCancel }) {
  const [val, setVal] = React.useState(initial || '');
  const ref = React.useRef(null);
  React.useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const submit = () => onCommit(val.trim() || null);
  return (
    <div className="floating-popup" style={{ left: x, top: y }} onMouseDown={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}>
      <input
        ref={ref}
        value={val}
        placeholder={placeholder}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); submit(); }
          else if (e.key === 'Escape') onCancel();
        }}
      />
      <button className="fp-btn ok" onClick={submit}>✓</button>
      <button className="fp-btn cancel" onClick={onCancel}>✕</button>
    </div>
  );
}

const typeIcon = { folder: '▸', folderOpen: '▾', image: '◈', video: '▶', doc: '▤', archive: '▦', file: '·' };

const extType = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'bmp', 'heic'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) return 'video';
  if (['pdf', 'md', 'txt', 'doc', 'docx'].includes(ext)) return 'doc';
  if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) return 'archive';
  return 'file';
};

async function readDir(handle) {
  const entries = [];
  for await (const [name, h] of handle.entries()) {
    if (name.startsWith('.')) continue;
    if (h.kind === 'directory') {
      entries.push({ name, kind: 'dir', handle: h, children: null });
    } else {
      entries.push({ name, kind: 'file', handle: h, type: extType(name) });
    }
  }
  entries.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'dir' ? -1 : 1));
  return entries;
}

function FolderBrowser({ folder, onOpenImage, notify, onRefresh }) {
  const [thumbs, setThumbs] = React.useState({});
  const [selected, setSelected] = React.useState(new Set());
  const [ctx, setCtx] = React.useState(null);
  const [info, setInfo] = React.useState(null);
  const [sortBy, setSortBy] = React.useState('name');
  const [viewSize, setViewSize] = React.useState(160);
  const [clipboard, setClipboard] = React.useState(null);

  const imageFiles = React.useMemo(() => folder.entries.filter((e) => e.kind === 'file' && e.type === 'image'), [folder.entries]);
  const subFolders = React.useMemo(() => folder.entries.filter((e) => e.kind === 'dir'), [folder.entries]);

  const sorted = React.useMemo(() => {
    const arr = [...imageFiles];
    if (sortBy === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [imageFiles, sortBy]);

  const thumbsRef = React.useRef(thumbs);
  thumbsRef.current = thumbs;

  React.useEffect(() => {
    let cancelled = false;
    const createdUrls = [];
    (async () => {
      for (const f of sorted) {
        if (cancelled || thumbsRef.current[f.name]) continue;
        try {
          const file = await f.handle.getFile();
          const url = URL.createObjectURL(file);
          createdUrls.push(url);
          if (cancelled) { URL.revokeObjectURL(url); return; }
          setThumbs((t) => ({ ...t, [f.name]: { url, size: file.size, lastModified: file.lastModified } }));
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [sorted]);

  React.useEffect(() => {
    return () => {
      Object.values(thumbsRef.current).forEach((t) => { if (t?.url) URL.revokeObjectURL(t.url); });
    };
  }, []);

  React.useEffect(() => {
    const activeNames = new Set(sorted.map((f) => f.name));
    setThumbs((prev) => {
      const next = {};
      let changed = false;
      for (const [name, t] of Object.entries(prev)) {
        if (activeNames.has(name)) next[name] = t;
        else { if (t?.url) URL.revokeObjectURL(t.url); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [folder.handle]);

  const openFile = async (f) => {
    try {
      const file = await f.handle.getFile();
      const url = URL.createObjectURL(file);
      onOpenImage({ name: f.name, url, size: file.size });
    } catch (e) { notify(e.message); }
  };

  const toggleSelect = (name, e) => {
    setSelected((s) => {
      const next = new Set(e.metaKey || e.ctrlKey ? s : []);
      if (s.has(name) && (e.metaKey || e.ctrlKey)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleCtx = (e, f) => {
    e.preventDefault();
    if (!selected.has(f.name)) setSelected(new Set([f.name]));
    setCtx({ x: e.clientX, y: e.clientY, file: f });
  };

  const renameFile = async (f) => {
    const newName = prompt('Rename to:', f.name);
    if (!newName || newName === f.name) return;
    try {
      const file = await f.handle.getFile();
      const buf = await file.arrayBuffer();
      const newHandle = await folder.handle.getFileHandle(newName, { create: true });
      const writable = await newHandle.createWritable();
      await writable.write(buf);
      await writable.close();
      await folder.handle.removeEntry(f.name);
      notify(`Renamed to ${newName}`);
      onRefresh?.();
    } catch (e) { notify(`Rename failed: ${e.message}`); }
  };

  const duplicateFile = async (f) => {
    try {
      const file = await f.handle.getFile();
      const buf = await file.arrayBuffer();
      const dot = f.name.lastIndexOf('.');
      const newName = dot > 0 ? `${f.name.slice(0, dot)}-copy${f.name.slice(dot)}` : `${f.name}-copy`;
      const newHandle = await folder.handle.getFileHandle(newName, { create: true });
      const writable = await newHandle.createWritable();
      await writable.write(buf);
      await writable.close();
      notify(`Duplicated as ${newName}`);
      onRefresh?.();
    } catch (e) { notify(`Duplicate failed: ${e.message}`); }
  };

  const deleteFiles = async (names) => {
    if (!confirm(`Delete ${names.length} file(s)?`)) return;
    for (const name of names) {
      try { await folder.handle.removeEntry(name); } catch (e) { notify(`Delete failed: ${e.message}`); }
    }
    notify(`Deleted ${names.length}`);
    setSelected(new Set());
    onRefresh?.();
  };

  const copySelected = async () => {
    setClipboard({ op: 'copy', files: [...selected] });
    notify(`Copied ${selected.size} to clipboard`);
  };

  const cutSelected = async () => {
    setClipboard({ op: 'cut', files: [...selected] });
    notify(`Cut ${selected.size}`);
  };

  const pasteClipboard = async () => {
    if (!clipboard) return;
    for (const name of clipboard.files) {
      try {
        const src = await folder.handle.getFileHandle(name);
        const file = await src.getFile();
        const buf = await file.arrayBuffer();
        const dot = name.lastIndexOf('.');
        const newName = clipboard.op === 'copy'
          ? (dot > 0 ? `${name.slice(0, dot)}-copy${name.slice(dot)}` : `${name}-copy`)
          : name;
        if (clipboard.op === 'copy') {
          const nh = await folder.handle.getFileHandle(newName, { create: true });
          const w = await nh.createWritable();
          await w.write(buf); await w.close();
        }
      } catch (e) { notify(e.message); }
    }
    notify(`Pasted ${clipboard.files.length}`);
    if (clipboard.op === 'cut') setClipboard(null);
    onRefresh?.();
  };

  const showInfo = async (f) => {
    try {
      const file = await f.handle.getFile();
      let exif = null;
      try {
        const exifr = await import('https://cdn.jsdelivr.net/npm/exifr@7/+esm');
        exif = await exifr.parse(file, { tiff: true, xmp: false, icc: false, iptc: true });
      } catch {}
      const dims = await new Promise((res) => {
        const img = new Image();
        img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => res(null);
        img.src = URL.createObjectURL(file);
      });
      setInfo({ file, name: f.name, size: file.size, lastModified: file.lastModified, exif, dims });
    } catch (e) { notify(e.message); }
  };

  const ctxItems = ctx ? [
    { label: 'Open', action: () => openFile(ctx.file) },
    { sep: true },
    { label: 'Rename', action: () => renameFile(ctx.file) },
    { label: 'Duplicate', action: () => duplicateFile(ctx.file) },
    { label: 'Copy', action: copySelected },
    { label: 'Cut', action: cutSelected },
    { label: 'Paste', action: pasteClipboard, disabled: !clipboard },
    { sep: true },
    { label: 'Delete', action: () => deleteFiles([...selected]), danger: true },
    { sep: true },
    { label: 'Properties / EXIF', action: () => showInfo(ctx.file) },
  ] : [];

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selected.size > 0) deleteFiles([...selected]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  return (
    <div className="artboard folder-browser">
      <div className="fb-topbar">
        <div className="fb-breadcrumb">
          <strong>{folder.path}</strong>
          <span className="fb-count">{imageFiles.length} images, {subFolders.length} folders</span>
        </div>
        <div className="fb-actions">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="dark-select">
            <option value="name">Sort: Name</option>
            <option value="size">Sort: Size</option>
          </select>
          <label className="fb-size">
            <span>Size</span>
            <input type="range" min="80" max="280" value={viewSize} onChange={(e) => setViewSize(+e.target.value)} className="slider" />
          </label>
          <button className="tool" onClick={pasteClipboard} disabled={!clipboard}>Paste</button>
          <button className="tool" onClick={onRefresh}>↻</button>
        </div>
      </div>

      <div className="fb-grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${viewSize}px, 1fr))` }}>
        {sorted.map((f) => {
          const t = thumbs[f.name];
          const isSel = selected.has(f.name);
          return (
            <div
              key={f.name}
              className={`fb-card${isSel ? ' selected' : ''}`}
              onClick={(e) => toggleSelect(f.name, e)}
              onDoubleClick={() => openFile(f)}
              onContextMenu={(e) => handleCtx(e, f)}
            >
              <div className="fb-thumb">
                {t ? <img src={t.url} alt={f.name} loading="lazy" /> : <div className="fb-loading">…</div>}
                <span className="fb-ext">{f.name.split('.').pop().toUpperCase()}</span>
              </div>
              <div className="fb-name" title={f.name}>{f.name}</div>
            </div>
          );
        })}
        {sorted.length === 0 && <div className="fb-empty">No images in this folder.</div>}
      </div>

      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y} items={ctxItems}
          onPick={(item) => { item.action(); setCtx(null); }}
          onClose={() => setCtx(null)}
          fixed
        />
      )}

      {info && <FileInfoModal info={info} onClose={() => setInfo(null)} notify={notify} />}
    </div>
  );
}

function FileInfoModal({ info, onClose, notify }) {
  const { name, size, lastModified, exif, dims } = info;
  const kv = [
    ['Name', name],
    ['Size', `${(size / 1024).toFixed(1)} KB`],
    ['Modified', new Date(lastModified).toLocaleString()],
    ['Dimensions', dims ? `${dims.w} × ${dims.h}` : '—'],
  ];
  const exifRows = exif ? Object.entries(exif).slice(0, 40).map(([k, v]) => {
    const val = v instanceof Date ? v.toLocaleString() : (typeof v === 'object' ? JSON.stringify(v).slice(0, 80) : String(v).slice(0, 80));
    return [k, val];
  }) : [];

  const copyAll = async () => {
    const text = [...kv, ...exifRows].map(([k, v]) => `${k}: ${v}`).join('\n');
    try { await navigator.clipboard.writeText(text); notify('Properties copied'); } catch {}
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-window" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-titlebar">
          <div className="modal-traffic"><span className="tl tl-r" /><span className="tl tl-y" /><span className="tl tl-g" /></div>
          <div className="modal-title">Properties — {name}</div>
          <div className="modal-spacer" />
        </div>
        <div className="modal-body">
          <table className="props-table">
            <tbody>
              {kv.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
            </tbody>
          </table>
          {exifRows.length > 0 && (
            <>
              <div className="props-header">EXIF / IPTC</div>
              <table className="props-table">
                <tbody>
                  {exifRows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                </tbody>
              </table>
            </>
          )}
        </div>
        <div className="modal-footer">
          <div className="modal-spacer" />
          <button className="modal-btn" onClick={onClose}>Close</button>
          <button className="modal-btn primary" onClick={copyAll}>Copy All</button>
        </div>
      </div>
    </div>
  );
}

function FileExplorer({ onOpenImage, onBrowseFolder }) {
  const [root, setRoot] = useState(null);
  const [tree, setTree] = useState([]);
  const [open, setOpen] = useState({});
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState(null);
  const [ctx, setCtx] = useState(null);
  const notify = useToast();

  const supported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const pickFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setRoot(handle);
      const entries = await readDir(handle);
      setTree(entries);
      setOpen({});
      notify(`Opened ${handle.name}`);
      onBrowseFolder?.({ handle, entries, path: handle.name });
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    }
  };

  const toggleDir = async (node, pathKey) => {
    const willOpen = !open[pathKey];
    setOpen((s) => ({ ...s, [pathKey]: willOpen }));
    if (willOpen && node.children === null) {
      try {
        const kids = await readDir(node.handle);
        node.children = kids;
        setTree((t) => [...t]);
        onBrowseFolder?.({ handle: node.handle, entries: kids, path: node.name });
      } catch (e) {
        setError(e.message);
      }
    } else if (willOpen && node.children) {
      onBrowseFolder?.({ handle: node.handle, entries: node.children, path: node.name });
    }
  };

  const openFile = async (node) => {
    setSelected(node.name);
    notify(`Opened ${node.name}`);
    if (node.type === 'image' && onOpenImage) {
      try {
        const file = await node.handle.getFile();
        const url = URL.createObjectURL(file);
        onOpenImage({ name: node.name, url, size: file.size });
      } catch (e) {
        setError(e.message);
      }
    }
  };

  const renderNode = (node, depth, parentPath) => {
    const key = `${parentPath}/${node.name}`;
    if (filter && !node.name.toLowerCase().includes(filter.toLowerCase()) && node.kind === 'file') return null;

    if (node.kind === 'dir') {
      const isOpen = !!open[key];
      return (
        <div key={key}>
          <button
            className="file-row folder"
            style={{ paddingLeft: 6 + depth * 12 }}
            onClick={() => toggleDir(node, key)}
          >
            <span className="chev">{isOpen ? typeIcon.folderOpen : typeIcon.folder}</span>
            <span className="fname">{node.name}</span>
            {node.children && <span className="fcount">{node.children.length}</span>}
          </button>
          {isOpen && node.children && node.children.map((c) => renderNode(c, depth + 1, key))}
        </div>
      );
    }

    return (
      <button
        key={key}
        className={`file-row file${selected === node.name ? ' active' : ''}`}
        style={{ paddingLeft: 6 + depth * 12 }}
        onClick={() => openFile(node)}
        onContextMenu={(e) => {
          e.preventDefault();
          setCtx({ x: e.clientX, y: e.clientY, node });
        }}
      >
        <span className={`ficon t-${node.type}`}>{typeIcon[node.type] || typeIcon.file}</span>
        <span className="fname">{node.name}</span>
      </button>
    );
  };

  const fileCtxItems = ctx ? [
    { label: 'Open', action: () => openFile(ctx.node), disabled: ctx.node.type !== 'image' },
    { label: 'Copy name', action: async () => { try { await navigator.clipboard.writeText(ctx.node.name); notify('Name copied'); } catch {} } },
    { label: 'Download', action: async () => {
      try {
        const f = await ctx.node.handle.getFile();
        const url = URL.createObjectURL(f);
        const a = document.createElement('a'); a.href = url; a.download = ctx.node.name; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) { notify(e.message); }
    }},
    { sep: true },
    { label: 'Reveal info', action: async () => {
      try { const f = await ctx.node.handle.getFile(); notify(`${ctx.node.name} · ${(f.size / 1024).toFixed(1)} KB · ${new Date(f.lastModified).toLocaleString()}`); } catch {}
    }},
  ] : [];

  return (
    <div className="file-explorer">
      <div className="panel-header">
        <h3>Files</h3>
        <button className="fx-open" onClick={pickFolder} disabled={!supported} title={supported ? 'Open local folder' : 'Browser not supported'}>
          {root ? 'Change' : 'Open'}
        </button>
      </div>

      {!supported && (
        <div className="fx-note">Chromium browser required (Chrome/Edge/Brave).</div>
      )}

      {root && (
        <>
          <div className="fx-root">
            <span className="ficon t-folder">{typeIcon.folderOpen}</span>
            <span className="fname">{root.name}</span>
          </div>
          <div className="file-search">
            <input
              type="text"
              placeholder="Filter files..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="file-tree">
            {tree.map((n) => renderNode(n, 0, ''))}
          </div>
        </>
      )}

      {!root && supported && (
        <div className="fx-empty">
          <p>No folder opened.</p>
          <button className="ghost" onClick={pickFolder}>Open local folder</button>
        </div>
      )}

      {error && <div className="fx-error">{error}</div>}

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          items={fileCtxItems}
          onPick={(item) => { item.action(); setCtx(null); }}
          onClose={() => setCtx(null)}
          fixed
        />
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Panel({ className = '', children }) {
  return <div className={`panel ${className}`.trim()}>{children}</div>;
}

const defaultStyle = { color: '#d95f33', secondary: '#ffffff', stroke: 4, fill: 'transparent' };
const defaultTextProps = {
  font: 'Inter',
  weight: 'Regular',
  fontSize: 24,
  lineWidth: 2,
  bold: false,
  italic: false,
  underline: false,
  align: 'left',
  valign: 'middle',
  opacity: 100,
  padding: 4,
  lineSpacing: 0,
};

const defaultPenProps = {
  color: '#d7b74d',
  opacity: 100,
  width: 4,
  editable: true,
  smooth: false,
};

const penSwatches = ['#d95f33', '#2d8d4a', '#2b6aad', '#d7b74d', '#b03030', '#177a3c', '#1e5a99', '#c79b2a', '#8e2b24', '#145c32', '#184a77', '#a7852b', '#ffffff', '#1f1b18', '#2a2522', '#3a3330'];

const defaultHighlightProps = {
  color: '#d7b74d',
  shape: 'rect',
  opacity: 100,
};

const highlightSwatches = ['#d95f33', '#2d8d4a', '#2b6aad', '#d7b74d', '#c79b2a'];

const defaultArrowProps = {
  color: '#d95f33',
  opacity: 100,
  width: 15,
  lineStyle: 'solid',
  startHead: 'none',
  endHead: 'arrow',
  startSize: 3,
  endSize: 3,
};

const arrowSwatches = [
  { color: '#d95f33', style: 'solid', heads: 'end' },
  { color: '#2d8d4a', style: 'solid', heads: 'end' },
  { color: '#2b6aad', style: 'solid', heads: 'end' },
  { color: '#d7b74d', style: 'solid', heads: 'end' },
  { color: '#b03030', style: 'solid', heads: 'end' },
  { color: '#177a3c', style: 'solid', heads: 'end' },
  { color: '#1e5a99', style: 'solid', heads: 'end' },
  { color: '#c79b2a', style: 'solid', heads: 'end' },
  { color: '#b03030', style: 'dashed', heads: 'end' },
  { color: '#177a3c', style: 'dashed', heads: 'end' },
  { color: '#1e5a99', style: 'dashed', heads: 'end' },
  { color: '#c79b2a', style: 'dashed', heads: 'end' },
  { color: '#b03030', style: 'solid', heads: 'both-dot' },
  { color: '#177a3c', style: 'solid', heads: 'both-dot' },
  { color: '#1e5a99', style: 'solid', heads: 'both-dot' },
  { color: '#c79b2a', style: 'solid', heads: 'both-dot' },
  { color: '#b03030', style: 'solid', heads: 'none' },
  { color: '#177a3c', style: 'solid', heads: 'none' },
  { color: '#1e5a99', style: 'solid', heads: 'none' },
  { color: '#c79b2a', style: 'solid', heads: 'none' },
  { color: '#b03030', style: 'dashed', heads: 'none' },
  { color: '#177a3c', style: 'dashed', heads: 'none' },
  { color: '#1e5a99', style: 'dashed', heads: 'none' },
  { color: '#c79b2a', style: 'dashed', heads: 'none' },
  { color: '#b03030', style: 'solid', heads: 'both-dot' },
  { color: '#177a3c', style: 'solid', heads: 'both-dot' },
  { color: '#1e5a99', style: 'solid', heads: 'both-dot' },
  { color: '#c79b2a', style: 'solid', heads: 'both-dot' },
];

const defaultSelectionProps = {
  shape: 'ellipse',
  snap: false,
  bgFill: 'transparent',
};

const defaultFillProps = {
  color: '#d95f33',
  tolerance: 15,
  opacity: 63,
  globalFill: false,
};

const fillSwatches = ['#d95f33', '#2d8d4a', '#2b6aad', '#d7b74d', '#6e6258', '#f5efe4', '#1f1b18', null /* eyedropper slot */];

const defaultShapeProps = {
  variant: 'rect',
  fillMode: 'none',
  outlineColor: '#d95f33',
  lineWidth: 5,
  opacity: 100,
  lineStyle: 'solid',
};

const shapeSwatches = [
  { variant: 'rect', fill: '#2b6aad', outline: '#d95f33' },
  { variant: 'rect', fill: 'transparent', outline: '#2d8d4a' },
  { variant: 'rect', fill: 'transparent', outline: '#2b6aad' },
  { variant: 'rect', fill: 'transparent', outline: '#d7b74d' },
  { variant: 'rect', fill: 'transparent', outline: '#b03030' },
  { variant: 'rect', fill: 'transparent', outline: '#177a3c' },
  { variant: 'rect', fill: 'transparent', outline: '#1e5a99' },
  { variant: 'rect', fill: 'transparent', outline: '#c79b2a' },
  { variant: 'ellipse', fill: 'transparent', outline: '#b03030' },
  { variant: 'ellipse', fill: 'transparent', outline: '#177a3c' },
  { variant: 'ellipse', fill: 'transparent', outline: '#1e5a99' },
  { variant: 'ellipse', fill: 'transparent', outline: '#c79b2a' },
  { variant: 'arrow-shape', fill: 'transparent', outline: '#b03030' },
  { variant: 'arrow-shape', fill: 'transparent', outline: '#177a3c' },
  { variant: 'arrow-shape', fill: 'transparent', outline: '#1e5a99' },
  { variant: 'arrow-shape', fill: 'transparent', outline: '#c79b2a' },
];
const defaultFilters = { brightness: 100, contrast: 100, saturation: 100, filter: 'none', border: 0, rotate: 0, flipH: false, flipV: false };

function EditorScreen({ activeMode, content, onFlowSelect, loadedImage, setLoadedImage }) {
  const [activeTool, setActiveTool] = useState('Arrow');
  const [annotations, setAnnotations] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [pendingArrow, setPendingArrow] = useState(null);
  const [style, setStyle] = useState(defaultStyle);
  const [textProps, setTextProps] = useState(defaultTextProps);
  const [shapeProps, setShapeProps] = useState(defaultShapeProps);
  const [fillProps, setFillProps] = useState(defaultFillProps);
  const [selectionProps, setSelectionProps] = useState(defaultSelectionProps);
  const [arrowProps, setArrowProps] = useState(defaultArrowProps);
  const [highlightProps, setHighlightProps] = useState(defaultHighlightProps);
  const [penProps, setPenProps] = useState(defaultPenProps);
  const [ocrState, setOcrState] = useState(null);
  const [folderView, setFolderView] = useState(null);
  const [canvasSize, setCanvasSize] = useState('free');
  const [canvasBg, setCanvasBg] = useState('checker');
  const localFileRef = React.useRef(null);

  const pickLocalImage = () => localFileRef.current?.click();
  const onLocalFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setLoadedImage({ name: f.name, url, size: f.size });
    e.target.value = '';
  };
  const [exportModal, setExportModal] = useState(false);
  const jsonInputRef = React.useRef(null);

  const exportJson = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      image: loadedImage ? { name: loadedImage.name } : null,
      annotations,
      style,
      textProps,
      filters,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frameflow-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('JSON exported');
  };

  const [bgRemoving, setBgRemoving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotateDeg, setRotateDeg] = useState(0);

  const zoomPresets = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
  const adjustZoom = (delta) => setZoom((z) => Math.max(0.1, Math.min(5, +(z + delta).toFixed(2))));
  const setZoomPreset = (v) => setZoom(v);
  const adjustRotate = (delta) => setRotateDeg((r) => +(r + delta).toFixed(1));
  const applyRotate = () => { if (rotateDeg !== 0) { rotate(rotateDeg); setRotateDeg(0); } };

  const removeBackground = async () => {
    if (!loadedImage || bgRemoving) return;
    setBgRemoving(true);
    notify('Removing background... (first run downloads model ~40MB)');
    try {
      const mod = await import('https://esm.sh/@imgly/background-removal@1.6.0');
      const removeBg = mod.removeBackground || mod.default?.removeBackground || mod.default;
      const blob = await removeBg(loadedImage.url, {
        progress: (key, current, total) => {
          if (key.includes('compute')) notify(`Processing... ${Math.round((current / total) * 100)}%`);
        },
      });
      const url = URL.createObjectURL(blob);
      const dot = loadedImage.name.lastIndexOf('.');
      const newName = dot > 0 ? `${loadedImage.name.slice(0, dot)}-nobg.png` : `${loadedImage.name}-nobg.png`;
      setLoadedImage({ name: newName, url, size: blob.size });
      notify('Background removed');
    } catch (e) {
      notify(`BG removal failed: ${e.message}`);
    }
    setBgRemoving(false);
  };

  useEffect(() => {
    window.__fwExportJson = () => exportJson();
    window.__fwImportJson = () => jsonInputRef.current?.click();
    return () => { delete window.__fwExportJson; delete window.__fwImportJson; };
  }, []);

  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type.startsWith('image/')) {
          const file = it.getAsFile();
          if (file) {
            const url = URL.createObjectURL(file);
            setLoadedImage({ name: `pasted-${Date.now()}.png`, url, size: file.size });
            notify('Pasted image');
            return;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const importJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data.annotations)) setAnnotations(data.annotations);
        if (data.style) setStyle(data.style);
        if (data.textProps) setTextProps(data.textProps);
        if (data.filters) setFilters(data.filters);
        notify(`Imported ${data.annotations?.length || 0} annotations`);
      } catch (err) { notify(`Parse failed: ${err.message}`); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (activeTool !== 'Grab Text' || !loadedImage) return;
    runGrabText(loadedImage, setOcrState, notify);
    setActiveTool('Arrow');
  }, [activeTool, loadedImage]);
  const [filters, setFilters] = useState(defaultFilters);
  const stepCounter = React.useRef(0);
  const notify = useToast();

  useEffect(() => {
    setAnnotations([]);
    setRedoStack([]);
    setPendingArrow(null);
    setFilters(defaultFilters);
    stepCounter.current = 0;
  }, [loadedImage?.url]);

  const undoRef = React.useRef(null);
  const redoRef = React.useRef(null);
  const swapRef = React.useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta) {
        const k = e.key.toLowerCase();
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); undoRef.current?.(); }
        else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redoRef.current?.(); }
        return;
      }
      if (e.key.toLowerCase() === 'x') swapRef.current?.();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const swapColors = () => setStyle((s) => ({ ...s, color: s.secondary, secondary: s.color }));

  const pickColor = async () => {
    if (!window.EyeDropper) { notify('EyeDropper unsupported in this browser'); return; }
    try {
      const ed = new window.EyeDropper();
      const { sRGBHex } = await ed.open();
      setStyle((s) => ({ ...s, color: sRGBHex }));
      notify(`Picked ${sRGBHex}`);
    } catch (e) {
      if (e.name !== 'AbortError') notify(e.message);
    }
  };

  const applyCrop = async (rel) => {
    if (!loadedImage) return;
    const img = new Image();
    img.src = loadedImage.url;
    await new Promise((r) => { img.onload = r; });
    const sx = rel.x * img.naturalWidth;
    const sy = rel.y * img.naturalHeight;
    const sw = rel.w * img.naturalWidth;
    const sh = rel.h * img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setLoadedImage({ name: loadedImage.name, url, size: blob.size });
    }, 'image/png');
  };

  const rotate = async (deg) => {
    if (!loadedImage) return;
    const img = new Image();
    img.src = loadedImage.url;
    await new Promise((r) => { img.onload = r; });
    const canvas = document.createElement('canvas');
    const rad = (deg * Math.PI) / 180;
    const swap = deg % 180 !== 0;
    canvas.width = swap ? img.naturalHeight : img.naturalWidth;
    canvas.height = swap ? img.naturalWidth : img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setLoadedImage({ name: loadedImage.name, url, size: blob.size });
    }, 'image/png');
  };

  const flip = async (axis) => {
    if (!loadedImage) return;
    const img = new Image();
    img.src = loadedImage.url;
    await new Promise((r) => { img.onload = r; });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (axis === 'h') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    else { ctx.translate(0, canvas.height); ctx.scale(1, -1); }
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setLoadedImage({ name: loadedImage.name, url, size: blob.size });
    }, 'image/png');
  };

  const addAnnotation = (ann) => {
    setAnnotations((a) => [...a, { id: Date.now() + Math.random(), ...ann }]);
    setRedoStack([]);
  };
  const updateAnnotation = (id, patch) => setAnnotations((a) => a.map((x) => x.id === id ? { ...x, ...patch } : x));
  const removeAnnotation = (id) => setAnnotations((a) => a.filter((x) => x.id !== id));
  const duplicateAnnotation = (id) => setAnnotations((a) => {
    const src = a.find((x) => x.id === id);
    if (!src) return a;
    const shift = 0.02;
    const copy = { ...src, id: Date.now() + Math.random() };
    if ('x' in copy) copy.x += shift;
    if ('y' in copy) copy.y += shift;
    if ('x1' in copy) { copy.x1 += shift; copy.x2 += shift; copy.y1 += shift; copy.y2 += shift; }
    if (copy.points) copy.points = copy.points.map((pt) => ({ x: pt.x + shift, y: pt.y + shift }));
    return [...a, copy];
  });
  const undo = () => {
    setAnnotations((a) => {
      if (a.length === 0) return a;
      const last = a[a.length - 1];
      setRedoStack((r) => [...r, last]);
      return a.slice(0, -1);
    });
  };
  const redo = () => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const last = r[r.length - 1];
      setAnnotations((a) => [...a, last]);
      return r.slice(0, -1);
    });
  };
  const clear = () => { setAnnotations([]); setRedoStack([]); setPendingArrow(null); stepCounter.current = 0; };

  undoRef.current = undo;
  redoRef.current = redo;
  swapRef.current = swapColors;

  return (
    <main className="workspace" data-mode={activeMode} data-tool={activeTool}>
      <aside className="left-rail panel">
        <CompactDropZone onDropImage={setLoadedImage} onPick={pickLocalImage} notify={notify} />

        <div className="panel-divider" />
        <div className="panel-header"><h3>Effects</h3><span>{filters.filter}</span></div>
        <section className="inspector-group qs-group">
          <div className="filter-row">
            {['none', 'grayscale', 'sepia', 'invert'].map((f) => (
              <button key={f} className={`filter-pill${filters.filter === f ? ' active' : ''}`} onClick={() => setFilters((s) => ({ ...s, filter: f }))}>{f}</button>
            ))}
          </div>
          <label className="slider-row">
            <span>Brightness {filters.brightness}%</span>
            <input type="range" min="20" max="200" value={filters.brightness}
              onChange={(e) => setFilters((s) => ({ ...s, brightness: +e.target.value }))} className="slider" />
          </label>
          <label className="slider-row">
            <span>Contrast {filters.contrast}%</span>
            <input type="range" min="20" max="200" value={filters.contrast}
              onChange={(e) => setFilters((s) => ({ ...s, contrast: +e.target.value }))} className="slider" />
          </label>
          <label className="slider-row">
            <span>Saturation {filters.saturation}%</span>
            <input type="range" min="0" max="200" value={filters.saturation}
              onChange={(e) => setFilters((s) => ({ ...s, saturation: +e.target.value }))} className="slider" />
          </label>
          <label className="slider-row">
            <span>Border {filters.border}px</span>
            <input type="range" min="0" max="40" value={filters.border}
              onChange={(e) => setFilters((s) => ({ ...s, border: +e.target.value }))} className="slider" />
          </label>
          <button className="tool" onClick={() => setFilters(defaultFilters)}>Reset effects</button>
        </section>
      </aside>

      <section className="center-stage">
        <Panel className="canvas-toolbar">
          <ToolBar
            tools={['Arrow', 'Pen', 'Highlight', 'Shape', 'Fill', 'Callout', 'Step', 'Blur', 'Text', 'Mask', 'Selection', 'Crop', 'Grab Text']}
            value={activeTool}
            onSelect={(t) => { setActiveTool(t); setPendingArrow(null); }}
          />
          <div className="canvas-actions">
            <button className="tool" onClick={undo} disabled={annotations.length === 0} title="Undo (⌘Z)">↶</button>
            <button className="tool" onClick={redo} disabled={redoStack.length === 0} title="Redo (⌘⇧Z)">↷</button>
            <span className="divider" />
            <select value={canvasSize} onChange={(e) => setCanvasSize(e.target.value)} className="tool-select" title="Canvas size">
              <option value="free">Free</option>
              <option value="a3">A3</option>
              <option value="a4">A4</option>
              <option value="a5">A5</option>
              <option value="square">Square</option>
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
            </select>
            <span className="divider" />
            <div className="ctrl-group">
              <button className="tool" onClick={() => adjustZoom(-0.1)} disabled={!loadedImage} title="Zoom out 0.1">−</button>
              <select className="tool-select" value={zoom} onChange={(e) => setZoomPreset(+e.target.value)} disabled={!loadedImage} title="Zoom">
                {zoomPresets.map((v) => <option key={v} value={v}>{Math.round(v * 100)}%</option>)}
                {!zoomPresets.includes(zoom) && <option value={zoom}>{Math.round(zoom * 100)}%</option>}
              </select>
              <button className="tool" onClick={() => adjustZoom(0.1)} disabled={!loadedImage} title="Zoom in 0.1">+</button>
              <button className="tool" onClick={() => setZoom(1)} disabled={!loadedImage} title="Fit 100%">1:1</button>
            </div>
            <span className="divider" />
            <div className="ctrl-group">
              <button className="tool" onClick={() => rotate(-90)} disabled={!loadedImage} title="Rotate -90°">↺</button>
              <button className="tool" onClick={() => rotate(90)} disabled={!loadedImage} title="Rotate 90°">↻</button>
              <button className="tool" onClick={() => adjustRotate(-0.1)} disabled={!loadedImage} title="-0.1°">−</button>
              <input
                type="number"
                step="0.1"
                value={rotateDeg}
                onChange={(e) => setRotateDeg(+e.target.value)}
                className="deg-input"
                disabled={!loadedImage}
                title="Fine rotate degrees"
              />
              <button className="tool" onClick={() => adjustRotate(0.1)} disabled={!loadedImage} title="+0.1°">+</button>
              <button className="tool" onClick={applyRotate} disabled={!loadedImage || rotateDeg === 0} title="Apply rotation">Apply</button>
              <button className="tool" onClick={() => flip('h')} disabled={!loadedImage} title="Flip horizontal">⇋</button>
              <button className="tool" onClick={() => flip('v')} disabled={!loadedImage} title="Flip vertical">⇵</button>
            </div>
            <span className="divider" />
            <button
              className="tool bg-remove-btn"
              onClick={removeBackground}
              disabled={!loadedImage || bgRemoving}
              title="Remove background (AI)"
            >
              {bgRemoving ? '⏳' : '✂'} Remove BG
            </button>
            <span className="divider" />
            <input ref={jsonInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importJson} />
            <select value={canvasBg} onChange={(e) => setCanvasBg(e.target.value)} className="tool-select" title="Canvas background" disabled={!loadedImage}>
              <option value="checker">Checker</option>
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="gray">Gray</option>
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
            </select>
            <span className="divider" />
            <button className="tool" onClick={clear} disabled={annotations.length === 0}>Clear</button>
            <button className="tool primary-action" onClick={() => setExportModal(true)} disabled={!loadedImage}>Export…</button>
          </div>
        </Panel>

        <section className="canvas panel">
          {loadedImage && (
            <div className="canvas-header">
              <div>
                <p className="eyebrow">Loaded File</p>
                <h3>{loadedImage.name}</h3>
              </div>
              <div className="status-badge">{(loadedImage.size / 1024).toFixed(1)} KB</div>
            </div>
          )}
          {loadedImage ? (
            <ImageEditor
              image={loadedImage}
              tool={activeTool}
              annotations={annotations}
              addAnnotation={addAnnotation}
              updateAnnotation={updateAnnotation}
              removeAnnotation={removeAnnotation}
              duplicateAnnotation={duplicateAnnotation}
              pendingArrow={pendingArrow}
              setPendingArrow={setPendingArrow}
              stepCounter={stepCounter}
              style={style}
              textProps={textProps}
              shapeProps={shapeProps}
              arrowProps={arrowProps}
              penProps={penProps}
              highlightProps={highlightProps}
              filters={filters}
              canvasSize={canvasSize}
              canvasBg={canvasBg}
              zoom={zoom}
              onCrop={applyCrop}
            />
          ) : folderView ? (
            <FolderBrowser
              folder={folderView}
              onOpenImage={setLoadedImage}
              notify={notify}
              onRefresh={async () => {
                try {
                  const entries = await readDir(folderView.handle);
                  setFolderView({ ...folderView, entries });
                } catch {}
              }}
            />
          ) : (
            <>
              <input ref={localFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onLocalFile} />
              <BlankCanvasPrompt canvasSize={canvasSize} setCanvasSize={setCanvasSize} setLoadedImage={setLoadedImage} notify={notify} />
            </>
          )}
        </section>

        <section className="bottom-strip">
          <StripCard eyebrow="Templates" title="Guide, Timeline, Product Sheet" text="Reusable output structures, not just blank canvases." />
          <StripCard eyebrow="Batch Engine" title="Queue-heavy work in the background" text="Exports, AI cleanup, tagging, variants, and presets." />
          <StripCard eyebrow="Collaboration" title="Review links with context" text="Comments, approvals, pinned notes, and asset versions." />
        </section>
      </section>

      <aside className="right-rail panel dark-panel">
        <div className="panel-header">
          <h3>Quick Styles</h3>
          <span>{activeTool}</span>
        </div>

        {activeTool === 'Selection' ? null
         : activeTool === 'Pen' ? (
          <QuickStylesPen props={penProps} setProps={setPenProps} />
        ) : activeTool === 'Highlight' ? (
          <QuickStylesHighlight props={highlightProps} setProps={setHighlightProps} />
        ) : activeTool === 'Arrow' ? (
          <QuickStylesArrow arrowProps={arrowProps} setArrowProps={setArrowProps} />
        ) : activeTool === 'Fill' ? (
          <QuickStylesFill fillProps={fillProps} setFillProps={setFillProps} />
        ) : activeTool === 'Shape' ? (
          <QuickStylesShape shapeProps={shapeProps} setShapeProps={setShapeProps} />
        ) : (activeTool === 'Text' || activeTool === 'Callout') ? (
          <QuickStylesText activeTool={activeTool} onApply={(patch) => setTextProps((t) => ({ ...t, ...patch }))} color={style.color} setStyle={setStyle} />
        ) : (
          <section className="inspector-group qs-group">
            <p className="eyebrow">Color</p>
            <div className="color-dual">
              <div className="color-stack">
                <button className="color-swatch primary-color" style={{ background: style.color }} title={`Primary ${style.color}`}>
                  <input type="color" value={style.color} onChange={(e) => setStyle((s) => ({ ...s, color: e.target.value }))} />
                </button>
                <button className="color-swatch secondary-color" style={{ background: style.secondary }} title={`Secondary ${style.secondary}`}>
                  <input type="color" value={style.secondary} onChange={(e) => setStyle((s) => ({ ...s, secondary: e.target.value }))} />
                </button>
              </div>
              <div className="color-tools">
                <button className="mini-btn" onClick={swapColors} title="Swap colors (X)">⇄</button>
                <button className="mini-btn" onClick={pickColor} title="Eyedropper">◉</button>
              </div>
            </div>
            <div className="color-swatches">
              {['#d95f33', '#0f7b6c', '#d7b74d', '#2d3947', '#b03030', '#1f1b18', '#ffffff'].map((c) => (
                <button
                  key={c}
                  className={`swatch${style.color === c ? ' active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setStyle((s) => ({ ...s, color: c }))}
                  title={c}
                />
              ))}
            </div>
          </section>
        )}

        {(activeTool === 'Text' || activeTool === 'Callout') && (
          <ToolProperties
            tool={activeTool}
            props={textProps}
            setProps={setTextProps}
            color={style.color}
            setColor={(v) => setStyle((s) => ({ ...s, color: v }))}
            pickColor={pickColor}
            swapColors={swapColors}
          />
        )}
        {activeTool === 'Shape' && (
          <ShapeProperties props={shapeProps} setProps={setShapeProps} />
        )}
        {activeTool === 'Fill' && (
          <FillProperties props={fillProps} setProps={setFillProps} pickColor={pickColor} />
        )}
        {activeTool === 'Selection' && (
          <SelectionProperties props={selectionProps} setProps={setSelectionProps} />
        )}
        {activeTool === 'Arrow' && (
          <ArrowProperties props={arrowProps} setProps={setArrowProps} />
        )}
        {activeTool === 'Highlight' && (
          <HighlightProperties props={highlightProps} setProps={setHighlightProps} />
        )}
        {activeTool === 'Pen' && (
          <PenProperties props={penProps} setProps={setPenProps} />
        )}

        <section className="inspector-group qs-group">
          <p className="eyebrow">Stroke · {style.stroke}px</p>
          <input
            type="range" min="1" max="20" value={style.stroke}
            onChange={(e) => setStyle((s) => ({ ...s, stroke: +e.target.value }))}
            className="slider"
          />
        </section>

        <section className="inspector-group">
          <p className="eyebrow">Annotations · {annotations.length}</p>
          {annotations.length === 0 ? <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>None yet. Pick tool, click canvas.</span> :
            <ul className="ann-list">
              {annotations.slice(-6).reverse().map((a) => (
                <li key={a.id}>
                  <span>{a.kind}{a.n ? ` ${a.n}` : ''}{a.text ? `: ${a.text.slice(0, 14)}` : ''}</span>
                  <button className="chip" onClick={() => removeAnnotation(a.id)}>×</button>
                </li>
              ))}
            </ul>
          }
        </section>
      </aside>

      {ocrState && (
        <GrabTextModal state={ocrState} onClose={() => setOcrState(null)} notify={notify} />
      )}

      {exportModal && (
        <ExportModal
          image={loadedImage}
          annotations={annotations}
          filters={filters}
          style={style}
          onClose={() => setExportModal(false)}
          notify={notify}
        />
      )}
    </main>
  );
}

const canvasAspects = { free: null, a3: 297 / 420, a4: 210 / 297, a5: 148 / 210, square: 1, '16:9': 16 / 9, '9:16': 9 / 16 };
const canvasPixelSize = {
  free: { w: 1600, h: 1200 },
  a3: { w: 2480, h: 3508 },
  a4: { w: 1240, h: 1754 },
  a5: { w: 874, h: 1240 },
  square: { w: 1200, h: 1200 },
  '16:9': { w: 1920, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
};

function createBlankImage(sizeKey, bg = '#ffffff') {
  const { w, h } = canvasPixelSize[sizeKey] || canvasPixelSize.free;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  return new Promise((r) => canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    r({ name: `blank-${sizeKey}-${Date.now()}.png`, url, size: blob.size });
  }, 'image/png'));
}

function ImageEditor({ image, tool, annotations, addAnnotation, updateAnnotation, pendingArrow, setPendingArrow, stepCounter, removeAnnotation, duplicateAnnotation, style, textProps, shapeProps, arrowProps, penProps, highlightProps, filters, canvasSize, canvasBg = 'checker', zoom = 1, onCrop }) {
  const wrapRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const [ctxMenu, setCtxMenu] = React.useState(null);
  const [drag, setDrag] = React.useState(null);
  const [popup, setPopup] = React.useState(null);
  const [moveAnn, setMoveAnn] = React.useState(null);
  const [selectedId, setSelectedId] = React.useState(null);
  const notify = useToast();

  const dragTools = ['Arrow', 'Rect', 'Ellipse', 'Blur', 'Mask', 'Crop'];

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.scrollTo({
      left: Math.max(0, (el.scrollWidth - el.clientWidth) / 2),
      top: Math.max(0, (el.scrollHeight - el.clientHeight) / 2),
    });
  }, [zoom, canvasSize, image?.url]);
  const freeTools = ['Pen', 'Highlight'];
  const isDragTool = dragTools.includes(tool);
  const isFreeTool = freeTools.includes(tool);
  const [freePath, setFreePath] = React.useState(null);

  const openTextPopup = (e, opts) => {
    const rect = wrapRef.current.getBoundingClientRect();
    setPopup({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      initial: opts.initial || '',
      placeholder: opts.placeholder || 'Text',
      onCommit: (text) => { setPopup(null); if (text != null) opts.onCommit(text); },
      onCancel: () => setPopup(null),
    });
  };

  const editAnnotation = (e, a) => {
    e.stopPropagation();
    const rect = wrapRef.current.getBoundingClientRect();
    setPopup({
      x: a.x * (stageRef.current.clientWidth) + (stageRef.current.offsetLeft || 0),
      y: a.y * (stageRef.current.clientHeight) - 10,
      initial: a.text,
      placeholder: a.kind === 'callout' ? 'Callout' : 'Text',
      onCommit: (text) => { setPopup(null); if (text != null) updateAnnotation(a.id, { text }); },
      onCancel: () => setPopup(null),
    });
  };

  const startMove = (e, a) => {
    e.stopPropagation();
    const p = getRelPos(e);
    setMoveAnn({ id: a.id, startX: p.x, startY: p.y, orig: { ...a, points: a.points ? [...a.points] : null }, moved: false });
  };

  const onImgLoad = (e) => {
    setSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  };

  const getRelPos = (e) => {
    const rect = stageRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const applyTool = (toolName, p, nativeEvent) => {
    if (toolName === 'Step') {
      stepCounter.current += 1;
      addAnnotation({ kind: 'step', x: p.x, y: p.y, n: stepCounter.current, color: style.color });
    } else if (toolName === 'Callout') {
      const tp = textProps || {};
      openTextPopup(nativeEvent, {
        placeholder: 'Callout',
        onCommit: (text) => addAnnotation({
          kind: 'callout', x: p.x, y: p.y, text,
          color: style.color,
          fontSize: tp.fontSize ? tp.fontSize / 800 : 0.028,
          bold: tp.bold, italic: tp.italic, underline: tp.underline,
          font: tp.font,
          opacity: tp.opacity,
        }),
      });
    } else if (toolName === 'Text') {
      const tp = textProps || {};
      openTextPopup(nativeEvent, {
        placeholder: 'Text',
        onCommit: (text) => addAnnotation({
          kind: 'text', x: p.x, y: p.y, text,
          color: style.color,
          fontSize: tp.fontSize ? tp.fontSize / 800 : 0.028,
          bold: tp.bold, italic: tp.italic, underline: tp.underline,
          font: tp.font,
          opacity: tp.opacity,
        }),
      });
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (popup) return;
    if (ctxMenu) { setCtxMenu(null); return; }
    setSelectedId(null);
    const p = getRelPos(e);
    if (isFreeTool) {
      setFreePath([p]);
    } else if (isDragTool) {
      setDrag({ start: p, end: p });
    } else {
      applyTool(tool, p, e);
    }
  };

  const handleMouseMove = (e) => {
    if (moveAnn) {
      const p = getRelPos(e);
      const dx = p.x - moveAnn.startX;
      const dy = p.y - moveAnn.startY;
      if (!moveAnn.moved && (Math.abs(dx) > 0.003 || Math.abs(dy) > 0.003)) {
        setMoveAnn((m) => ({ ...m, moved: true }));
      }
      const o = moveAnn.orig;
      const patch = {};
      if ('x' in o) patch.x = o.x + dx;
      if ('y' in o) patch.y = o.y + dy;
      if ('x1' in o) { patch.x1 = o.x1 + dx; patch.y1 = o.y1 + dy; patch.x2 = o.x2 + dx; patch.y2 = o.y2 + dy; }
      if (o.points) patch.points = o.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
      updateAnnotation(moveAnn.id, patch);
      return;
    }
    if (freePath) {
      const p = getRelPos(e);
      setFreePath((f) => [...f, p]);
      return;
    }
    if (!drag) return;
    setDrag({ ...drag, end: getRelPos(e) });
  };

  const handleMouseUp = (e) => {
    if (moveAnn) {
      const { id, moved, orig } = moveAnn;
      setMoveAnn(null);
      if (!moved) {
        setSelectedId(id);
        if (orig.kind === 'text' || orig.kind === 'callout') {
          const a = annotations.find((x) => x.id === id) || orig;
          editAnnotation(e, a);
        }
      }
      return;
    }
    if (freePath) {
      if (freePath.length > 1) {
        const kind = tool === 'Pen' ? 'pen' : 'highlight';
        const tp = (kind === 'pen' ? penProps : highlightProps) || {};
        addAnnotation({
          kind,
          points: freePath,
          color: tp.color || style.color,
          stroke: tp.width || style.stroke,
          opacity: tp.opacity,
        });
      }
      setFreePath(null);
      return;
    }
    if (!drag) return;
    const x = Math.min(drag.start.x, drag.end.x);
    const y = Math.min(drag.start.y, drag.end.y);
    const w = Math.abs(drag.end.x - drag.start.x);
    const h = Math.abs(drag.end.y - drag.start.y);
    setDrag(null);
    if (w < 0.005 || h < 0.005) return;
    if (tool === 'Crop') {
      onCrop({ x, y, w, h });
      return;
    }
    if (tool === 'Arrow') {
      const ap = arrowProps || {};
      addAnnotation({
        kind: 'arrow',
        x1: drag.start.x, y1: drag.start.y, x2: drag.end.x, y2: drag.end.y,
        color: ap.color || style.color,
        stroke: ap.width || style.stroke,
        lineStyle: ap.lineStyle,
        opacity: ap.opacity,
      });
      return;
    }
    if (tool === 'Shape') {
      const sp = shapeProps || {};
      const variant = sp.variant || 'rect';
      addAnnotation({
        kind: variant,
        x, y, w, h,
        color: sp.outlineColor || style.color,
        stroke: sp.lineWidth || style.stroke,
        fillMode: sp.fillMode,
        fillColor: sp.fillColor,
        opacity: sp.opacity,
      });
      return;
    }
    if (tool === 'Selection') return;
    const kind = tool.toLowerCase();
    addAnnotation({ kind, x, y, w, h, color: style.color, stroke: style.stroke });
  };

  const handleContextMenu = (e, annotation = null) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = wrapRef.current.getBoundingClientRect();
    setCtxMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pos: getRelPos(e),
      annotation,
    });
  };

  const copyImage = async () => {
    try {
      const blob = await (await fetch(image.url)).blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      notify('Image copied to clipboard');
    } catch (err) {
      notify(`Copy failed: ${err.message}`);
    }
  };

  React.useEffect(() => {
    const close = () => setCtxMenu(null);
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') { setCtxMenu(null); setPendingArrow(null); setSelectedId(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        removeAnnotation(selectedId);
        setSelectedId(null);
        e.preventDefault();
      }
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [ctxMenu, selectedId]);

  const annItems = [
    { label: 'Duplicate', action: (a) => duplicateAnnotation(a.id) },
    { label: 'Delete', action: (a) => removeAnnotation(a.id), danger: true },
  ];

  const canvasItems = [
    { label: 'Add Step here', action: (p) => { stepCounter.current += 1; addAnnotation({ kind: 'step', x: p.x, y: p.y, n: stepCounter.current, color: style.color }); } },
    { label: 'Add Text here', action: (p) => { const t = prompt('Text:', 'Label'); if (t) addAnnotation({ kind: 'text', x: p.x, y: p.y, text: t, color: style.color }); } },
    { label: 'Add Callout here', action: (p) => { const t = prompt('Callout:', 'Note'); if (t) addAnnotation({ kind: 'callout', x: p.x, y: p.y, text: t, color: style.color }); } },
    { label: 'Add Arrow from here', action: (p) => setPendingArrow(p) },
    { label: 'Blur region', action: (p) => addAnnotation({ kind: 'blur', x: p.x - 0.08, y: p.y - 0.04, w: 0.16, h: 0.08 }) },
    { label: 'Mask region', action: (p) => addAnnotation({ kind: 'mask', x: p.x - 0.1, y: p.y - 0.05, w: 0.2, h: 0.1, color: style.color }) },
    { sep: true },
    { label: 'Copy image', action: copyImage },
    { label: 'Save as...', action: () => exportCanvas(image, annotations, filters, style) },
    { sep: true },
    { label: 'Clear annotations', action: () => annotations.forEach((a) => removeAnnotation(a.id)), danger: true, disabled: annotations.length === 0 },
  ];

  const cssFilter = [
    filters.brightness !== 100 && `brightness(${filters.brightness}%)`,
    filters.contrast !== 100 && `contrast(${filters.contrast}%)`,
    filters.saturation !== 100 && `saturate(${filters.saturation}%)`,
    filters.filter === 'grayscale' && 'grayscale(1)',
    filters.filter === 'sepia' && 'sepia(1)',
    filters.filter === 'invert' && 'invert(1)',
  ].filter(Boolean).join(' ') || 'none';

  const borderStyle = filters.border > 0
    ? { boxShadow: `inset 0 0 0 ${filters.border}px ${style.color}` }
    : {};

  const dragPreview = drag ? {
    x: Math.min(drag.start.x, drag.end.x),
    y: Math.min(drag.start.y, drag.end.y),
    w: Math.abs(drag.end.x - drag.start.x),
    h: Math.abs(drag.end.y - drag.start.y),
  } : null;

  const ratio = canvasAspects[canvasSize];
  const stageStyle = {
    ...borderStyle,
    transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: 'center center',
    ...(ratio ? { aspectRatio: ratio, maxWidth: '100%', maxHeight: '100%', width: 'auto', height: '100%' } : {}),
  };

  return (
    <div className={`artboard image-board bg-${canvasBg}`} ref={wrapRef} onContextMenu={(e) => handleContextMenu(e)}>
      <div
        ref={stageRef}
        className={`img-stage tool-${tool.toLowerCase()}`}
        style={stageStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img src={image.url} alt={image.name} onLoad={onImgLoad} draggable={false} style={{ filter: cssFilter }} />
        <svg className="ann-layer" viewBox="0 0 1 1" preserveAspectRatio="none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill={style.color} />
            </marker>
          </defs>
          {annotations.map((a) => {
            const onCtx = (e) => handleContextMenu(e, a);
            const onDown = (e) => { if (e.button === 0) startMove(e, a); };
            const hitStyle = { pointerEvents: 'all', cursor: 'move' };
            const c = a.color || '#d95f33';
            const sw = (a.stroke || 4) / 600;
            const fontSize = (a.fontSize || 0.028);
            if (a.kind === 'arrow') {
              const dx = a.x2 - a.x1, dy = a.y2 - a.y1;
              const len = Math.hypot(dx, dy) || 1;
              const ux = dx / len, uy = dy / len;
              const headLen = Math.max(sw * 3.5, 0.018);
              const headW = headLen * 0.6;
              const px = -uy, py = ux;
              const tx = a.x2, ty = a.y2;
              const bx = tx - ux * headLen, by = ty - uy * headLen;
              const p1x = bx + px * headW, p1y = by + py * headW;
              const p2x = bx - px * headW, p2y = by - py * headW;
              return (
                <g key={a.id} style={{ pointerEvents: 'all', cursor: 'move' }} onContextMenu={onCtx} onMouseDown={onDown}>
                  <line x1={a.x1} y1={a.y1} x2={bx + ux * headLen * 0.4} y2={by + uy * headLen * 0.4} stroke={c} strokeWidth={sw} strokeLinecap="round" />
                  <polygon points={`${tx},${ty} ${p1x},${p1y} ${p2x},${p2y}`} fill={c} />
                </g>
              );
            }
            if (a.kind === 'step') {
              const r = a.size || 0.022;
              return (
                <g key={a.id} style={{ ...hitStyle, opacity: (a.opacity != null ? a.opacity : 100) / 100 }} onContextMenu={onCtx} onMouseDown={onDown}>
                  <circle cx={a.x} cy={a.y} r={r} fill={c} />
                  <text x={a.x} y={a.y + r * 0.36} textAnchor="middle" fontSize={r * 1.3} fill="#fff" fontWeight="700">{a.n}</text>
                </g>
              );
            }
            if (a.kind === 'callout') return (
              <g key={a.id} style={hitStyle} onContextMenu={onCtx} onMouseDown={onDown}>
                <rect x={a.x} y={a.y} width={Math.min(0.24, fontSize * 0.45 * a.text.length + 0.04)} height={fontSize * 1.8} rx="0.01" fill="rgba(255,251,246,0.98)" stroke={c} strokeWidth="0.002" />
                <text x={a.x + 0.012} y={a.y + fontSize * 1.2} fontSize={fontSize * 0.8} fill="#1f1b18" fontWeight={a.bold ? 700 : 400} fontStyle={a.italic ? 'italic' : 'normal'} fontFamily={a.font || 'Inter, sans-serif'}>{a.text}</text>
              </g>
            );
            if (a.kind === 'text') return <text key={a.id} x={a.x} y={a.y} fontSize={fontSize} fill={c} fontWeight={a.bold ? 700 : 600} fontStyle={a.italic ? 'italic' : 'normal'} textDecoration={a.underline ? 'underline' : 'none'} fontFamily={a.font || 'Inter, sans-serif'} opacity={(a.opacity != null ? a.opacity : 100) / 100} style={hitStyle} onContextMenu={onCtx} onMouseDown={onDown}>{a.text}</text>;
            const op = a.opacity != null ? a.opacity / 100 : 1;
            if (a.kind === 'blur') return <rect key={a.id} x={a.x} y={a.y} width={a.w} height={a.h} fill="rgba(200,200,200,0.9)" opacity={op} style={hitStyle} onContextMenu={onCtx} onMouseDown={onDown} />;
            if (a.kind === 'mask') return <rect key={a.id} x={a.x} y={a.y} width={a.w} height={a.h} fill={c + '33'} stroke={c} strokeWidth={sw} opacity={op} style={hitStyle} onContextMenu={onCtx} onMouseDown={onDown} />;
            if (a.kind === 'rect') return <rect key={a.id} x={a.x} y={a.y} width={a.w} height={a.h} fill="transparent" stroke={c} strokeWidth={sw} opacity={op} style={hitStyle} onContextMenu={onCtx} onMouseDown={onDown} />;
            if (a.kind === 'ellipse') return <ellipse key={a.id} cx={a.x + a.w / 2} cy={a.y + a.h / 2} rx={a.w / 2} ry={a.h / 2} fill="transparent" stroke={c} strokeWidth={sw} opacity={op} style={hitStyle} onContextMenu={onCtx} onMouseDown={onDown} />;
            if (a.kind === 'arrow-shape') {
              const nx = a.x, ny = a.y, nw = a.w, nh = a.h;
              const tipX = nx + nw;
              const tipY = ny + nh / 2;
              const neckX = nx + nw * 0.65;
              const bodyTop = ny + nh * 0.3;
              const bodyBot = ny + nh * 0.7;
              const points = `${nx},${bodyTop} ${neckX},${bodyTop} ${neckX},${ny} ${tipX},${tipY} ${neckX},${ny + nh} ${neckX},${bodyBot} ${nx},${bodyBot}`;
              const fill = a.fillMode === 'solid' ? (a.fillColor || c) : 'transparent';
              return <polygon key={a.id} points={points} fill={fill} stroke={c} strokeWidth={sw} strokeLinejoin="round" opacity={op} style={hitStyle} onContextMenu={onCtx} onMouseDown={onDown} />;
            }
            if (a.kind === 'pen' || a.kind === 'highlight') {
              const d = pointsToPath(a.points);
              const opacity = a.kind === 'highlight' ? 0.4 : 1;
              const width = a.kind === 'highlight' ? sw * 3 : sw;
              return <path key={a.id} d={d} fill="none" stroke={c} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} style={{ pointerEvents: 'stroke', cursor: 'move' }} onContextMenu={onCtx} onMouseDown={onDown} />;
            }
            return null;
          })}
          {freePath && freePath.length > 1 && (
            <path
              d={pointsToPath(freePath)}
              fill="none"
              stroke={style.color}
              strokeWidth={tool === 'Highlight' ? style.stroke * 3 / 600 : style.stroke / 600}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={tool === 'Highlight' ? 0.4 : 1}
            />
          )}
          {drag && tool === 'Arrow' && (
            <line x1={drag.start.x} y1={drag.start.y} x2={drag.end.x} y2={drag.end.y} stroke={style.color} strokeWidth={style.stroke / 600} strokeDasharray="0.005 0.005" />
          )}
          {dragPreview && tool !== 'Crop' && tool !== 'Arrow' && (
            tool === 'Ellipse'
              ? <ellipse cx={dragPreview.x + dragPreview.w / 2} cy={dragPreview.y + dragPreview.h / 2} rx={dragPreview.w / 2} ry={dragPreview.h / 2} fill="transparent" stroke={style.color} strokeDasharray="0.005 0.005" strokeWidth="0.003" />
              : <rect x={dragPreview.x} y={dragPreview.y} width={dragPreview.w} height={dragPreview.h} fill={tool === 'Mask' ? style.color + '22' : 'transparent'} stroke={style.color} strokeDasharray="0.005 0.005" strokeWidth="0.003" />
          )}
          {dragPreview && tool === 'Crop' && (
            <>
              <rect x="0" y="0" width="1" height={dragPreview.y} fill="rgba(0,0,0,0.5)" />
              <rect x="0" y={dragPreview.y + dragPreview.h} width="1" height={1 - dragPreview.y - dragPreview.h} fill="rgba(0,0,0,0.5)" />
              <rect x="0" y={dragPreview.y} width={dragPreview.x} height={dragPreview.h} fill="rgba(0,0,0,0.5)" />
              <rect x={dragPreview.x + dragPreview.w} y={dragPreview.y} width={1 - dragPreview.x - dragPreview.w} height={dragPreview.h} fill="rgba(0,0,0,0.5)" />
              <rect x={dragPreview.x} y={dragPreview.y} width={dragPreview.w} height={dragPreview.h} fill="transparent" stroke="#fff" strokeWidth="0.003" strokeDasharray="0.008 0.008" />
            </>
          )}
          {pendingArrow && <circle cx={pendingArrow.x} cy={pendingArrow.y} r="0.01" fill={style.color} opacity="0.6" />}
          {selectedId && (() => {
            const a = annotations.find((x) => x.id === selectedId);
            if (!a) return null;
            const bounds = annBounds(a);
            if (!bounds) return null;
            return <rect x={bounds.x - 0.005} y={bounds.y - 0.005} width={bounds.w + 0.01} height={bounds.h + 0.01} fill="none" stroke="#3b82f6" strokeWidth="0.003" strokeDasharray="0.006 0.004" />;
          })()}
        </svg>
      </div>

      {selectedId && (() => {
        const a = annotations.find((x) => x.id === selectedId);
        if (!a) return null;
        const b = annBounds(a);
        if (!b || !stageRef.current) return null;
        const rect = stageRef.current.getBoundingClientRect();
        const wrapRect = wrapRef.current.getBoundingClientRect();
        const left = rect.left - wrapRect.left + b.x * rect.width;
        const top = rect.top - wrapRect.top + (b.y + b.h) * rect.height + 8;
        const strokeKinds = ['arrow', 'rect', 'ellipse', 'pen', 'highlight', 'mask'];
        const textKinds = ['text', 'callout'];
        const sizeKinds = ['step'];
        const fillKinds = ['rect', 'ellipse', 'callout', 'mask', 'blur'];
        return (
          <div className="sel-toolbar" style={{ left, top }} onMouseDown={(e) => e.stopPropagation()}>
            <label className="sel-field" title="Color">
              <span className="sel-swatch" style={{ background: a.color || '#5b8cc1' }} />
              <input type="color" value={a.color || '#5b8cc1'} onChange={(e) => updateAnnotation(a.id, { color: e.target.value })} className="sel-color-hidden" />
            </label>

            {strokeKinds.includes(a.kind) && (
              <label className="sel-field" title="Stroke width">
                <span className="sel-icon">▬</span>
                <input type="range" min="1" max="30" value={a.stroke || 4} onChange={(e) => updateAnnotation(a.id, { stroke: +e.target.value })} />
                <span className="sel-num">{a.stroke || 4}</span>
              </label>
            )}

            {textKinds.includes(a.kind) && (
              <>
                <label className="sel-field" title="Font size">
                  <span className="sel-icon">A</span>
                  <input type="range" min="0.015" max="0.1" step="0.002" value={a.fontSize || 0.028} onChange={(e) => updateAnnotation(a.id, { fontSize: +e.target.value })} />
                  <span className="sel-num">{Math.round((a.fontSize || 0.028) * 1000)}</span>
                </label>
                <button className={`sel-btn toggle${a.bold ? ' on' : ''}`} onClick={() => updateAnnotation(a.id, { bold: !a.bold })} title="Bold"><b>B</b></button>
                <button className={`sel-btn toggle${a.italic ? ' on' : ''}`} onClick={() => updateAnnotation(a.id, { italic: !a.italic })} title="Italic"><i>I</i></button>
                <button className={`sel-btn toggle${a.underline ? ' on' : ''}`} onClick={() => updateAnnotation(a.id, { underline: !a.underline })} title="Underline"><u>U</u></button>
                <button className="sel-btn" onClick={(e) => editAnnotation(e, a)} title="Edit text">✎</button>
              </>
            )}

            {sizeKinds.includes(a.kind) && (
              <label className="sel-field" title="Size">
                <span className="sel-icon">⊕</span>
                <input type="range" min="0.01" max="0.06" step="0.002" value={a.size || 0.022} onChange={(e) => updateAnnotation(a.id, { size: +e.target.value })} />
                <span className="sel-num">{Math.round((a.size || 0.022) * 1000)}</span>
              </label>
            )}

            {fillKinds.includes(a.kind) && (
              <label className="sel-field" title="Opacity">
                <span className="sel-icon">◐</span>
                <input type="range" min="0" max="100" value={a.opacity != null ? a.opacity : 100} onChange={(e) => updateAnnotation(a.id, { opacity: +e.target.value })} />
                <span className="sel-num">{a.opacity != null ? a.opacity : 100}</span>
              </label>
            )}

            <span className="sel-sep" />
            <button className="sel-btn" onClick={() => duplicateAnnotation(a.id)} title="Duplicate">⎘</button>
            <button className="sel-btn danger" onClick={() => { removeAnnotation(a.id); setSelectedId(null); }} title="Delete">🗑</button>
          </div>
        );
      })()}
      <div className="img-meta">
        <span>{image.name}</span>
        <span>{size.w}×{size.h}</span>
        <span>{(image.size / 1024).toFixed(1)} KB</span>
        <span>{annotations.length} annotations</span>
        <span className="hint">Right-click for menu · Esc to cancel</span>
      </div>

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.annotation ? annItems : canvasItems}
          onPick={(item) => {
            if (ctxMenu.annotation) item.action(ctxMenu.annotation);
            else item.action(ctxMenu.pos);
            setCtxMenu(null);
          }}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}

function ContextMenu({ x, y, items, onPick, onClose, fixed = false }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const off = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    const t = setTimeout(() => {
      document.addEventListener('mousedown', off);
      document.addEventListener('keydown', esc);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', off);
      document.removeEventListener('keydown', esc);
    };
  }, [onClose]);
  return (
    <div
      ref={ref}
      className="ctx-menu"
      style={{ position: fixed ? 'fixed' : 'absolute', left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it, i) => it.sep ? (
        <div key={`sep-${i}`} className="ctx-sep" />
      ) : (
        <button
          key={it.label}
          className={`ctx-item${it.danger ? ' danger' : ''}`}
          disabled={it.disabled}
          onClick={() => !it.disabled && onPick(it)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function annBounds(a) {
  if (!a) return null;
  if (a.kind === 'arrow') {
    const x = Math.min(a.x1, a.x2), y = Math.min(a.y1, a.y2);
    return { x, y, w: Math.abs(a.x2 - a.x1), h: Math.abs(a.y2 - a.y1) };
  }
  if (a.kind === 'step') return { x: a.x - 0.025, y: a.y - 0.025, w: 0.05, h: 0.05 };
  if (a.kind === 'callout') {
    const fs = a.fontSize || 0.028;
    return { x: a.x, y: a.y, w: Math.min(0.24, fs * 0.45 * a.text.length + 0.04), h: fs * 1.8 };
  }
  if (a.kind === 'text') return { x: a.x, y: a.y - 0.025, w: 0.02 * a.text.length, h: 0.035 };
  if (a.kind === 'pen' || a.kind === 'highlight') {
    const xs = a.points.map((p) => p.x), ys = a.points.map((p) => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  if ('w' in a) return { x: a.x, y: a.y, w: a.w, h: a.h };
  return null;
}

function pointsToPath(pts) {
  if (!pts || pts.length === 0) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  return d;
}

async function exportCanvas(image, annotations, filters = defaultFilters, style = defaultStyle, options = {}) {
  if (!image) return;
  const { format = 'png', quality = 0.92, scale = 1, bgFill = 'transparent' } = options;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = image.url;
  await new Promise((r) => { img.onload = r; });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (bgFill !== 'transparent') {
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const fParts = [];
  if (filters.brightness !== 100) fParts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) fParts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturation !== 100) fParts.push(`saturate(${filters.saturation}%)`);
  if (filters.filter === 'grayscale') fParts.push('grayscale(1)');
  if (filters.filter === 'sepia') fParts.push('sepia(1)');
  if (filters.filter === 'invert') fParts.push('invert(1)');
  ctx.filter = fParts.join(' ') || 'none';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';

  if (filters.border > 0) {
    ctx.strokeStyle = style.color;
    ctx.lineWidth = filters.border * 2 * scale;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }

  const W = canvas.width, H = canvas.height;
  for (const a of annotations) {
    const c = a.color || style.color;
    const sw = (a.stroke || 4) * scale;
    ctx.lineWidth = sw;
    ctx.strokeStyle = c;
    ctx.fillStyle = c;

    if (a.kind === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(a.x1 * W, a.y1 * H);
      ctx.lineTo(a.x2 * W, a.y2 * H);
      ctx.stroke();
      const angle = Math.atan2((a.y2 - a.y1) * H, (a.x2 - a.x1) * W);
      const hs = W * 0.02;
      ctx.beginPath();
      ctx.moveTo(a.x2 * W, a.y2 * H);
      ctx.lineTo(a.x2 * W - hs * Math.cos(angle - 0.4), a.y2 * H - hs * Math.sin(angle - 0.4));
      ctx.lineTo(a.x2 * W - hs * Math.cos(angle + 0.4), a.y2 * H - hs * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    } else if (a.kind === 'step') {
      ctx.beginPath();
      ctx.arc(a.x * W, a.y * H, W * 0.022, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${W * 0.028}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(a.n), a.x * W, a.y * H);
    } else if (a.kind === 'callout') {
      const w = Math.min(0.24, 0.012 * a.text.length + 0.04) * W;
      const h = 0.05 * H;
      ctx.fillStyle = 'rgba(255,251,246,0.98)';
      ctx.fillRect(a.x * W, a.y * H, w, h);
      ctx.strokeRect(a.x * W, a.y * H, w, h);
      ctx.fillStyle = '#1f1b18';
      ctx.font = `${W * 0.022}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.text, a.x * W + 0.012 * W, a.y * H + h / 2);
    } else if (a.kind === 'text') {
      ctx.font = `600 ${W * 0.028}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(a.text, a.x * W, a.y * H);
    } else if (a.kind === 'blur') {
      ctx.save();
      ctx.filter = 'blur(12px)';
      ctx.drawImage(canvas, a.x * W, a.y * H, a.w * W, a.h * H, a.x * W, a.y * H, a.w * W, a.h * H);
      ctx.restore();
    } else if (a.kind === 'mask') {
      ctx.fillStyle = c + '40';
      ctx.fillRect(a.x * W, a.y * H, a.w * W, a.h * H);
      ctx.strokeRect(a.x * W, a.y * H, a.w * W, a.h * H);
    } else if (a.kind === 'rect') {
      ctx.strokeRect(a.x * W, a.y * H, a.w * W, a.h * H);
    } else if (a.kind === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse((a.x + a.w / 2) * W, (a.y + a.h / 2) * H, (a.w / 2) * W, (a.h / 2) * H, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (a.kind === 'pen' || a.kind === 'highlight') {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (a.kind === 'highlight') {
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = sw * 3;
      }
      ctx.beginPath();
      a.points.forEach((p, i) => {
        const x = p.x * W, y = p.y * H;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }
  }
  const mime = `image/${format === 'jpeg' ? 'jpeg' : format}`;
  const ext = format === 'jpeg' ? 'jpg' : format;
  await new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-${image.name.replace(/\.[^.]+$/, '')}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, mime, quality);
  });
}

function CompactDropZone({ onDropImage, onPick, notify }) {
  const [over, setOver] = React.useState(false);
  const { t } = useI18n();
  const handleDrop = (e) => {
    e.preventDefault(); setOver(false);
    const file = [...(e.dataTransfer?.files || [])].find((f) => f.type.startsWith('image/'));
    if (!file) { notify?.('Drop image'); return; }
    const url = URL.createObjectURL(file);
    onDropImage({ name: file.name, url, size: file.size });
  };
  return (
    <div className={`compact-drop${over ? ' over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onClick={onPick}
    >
      <span className="cd-ico">⇩</span>
      <div className="cd-text">
        <strong>{t('Drop image here')}</strong>
        <span>{t('Choose file')}</span>
      </div>
    </div>
  );
}

function BlankCanvasPrompt({ canvasSize, setCanvasSize, setLoadedImage, notify }) {
  const [bg, setBg] = React.useState('#ffffff');
  const { t } = useI18n();
  const create = async () => {
    const img = await createBlankImage(canvasSize === 'free' ? 'free' : canvasSize, bg);
    setLoadedImage(img);
    notify('Blank canvas created');
  };
  const pasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.read) { notify('Clipboard API unavailable'); return; }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          const url = URL.createObjectURL(blob);
          const dims = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => resolve({ w: 0, h: 0 });
            img.src = url;
          });
          setCanvasSize('free');
          setLoadedImage({ name: `clipboard-${Date.now()}.${type.split('/')[1] || 'png'}`, url, size: blob.size, width: dims.w, height: dims.h });
          notify(`Image pasted ${dims.w}×${dims.h}`);
          return;
        }
      }
      notify('No image in clipboard');
    } catch (err) {
      notify('Clipboard read failed: ' + (err?.message || err));
    }
  };
  const sizes = [
    { id: 'a3', label: 'A3', dims: '297×420mm' },
    { id: 'a4', label: 'A4', dims: '210×297mm' },
    { id: 'a5', label: 'A5', dims: '148×210mm' },
    { id: 'square', label: '1:1', dims: '1200px' },
    { id: '16:9', label: '16:9', dims: '1920×1080' },
    { id: '9:16', label: '9:16', dims: '1080×1920' },
    { id: 'free', label: 'Free', dims: '1600×1200' },
  ];
  return (
    <div className="blank-prompt">
      <div className="bp-inner">
        <h2>{t('Drop image here') /* reuse */ } · New canvas</h2>
        <p>Pick a size and start drawing — or drop an image anywhere on the left panel.</p>
        <div className="size-grid">
          {sizes.map((s) => (
            <button
              key={s.id}
              className={`size-card${canvasSize === s.id ? ' active' : ''}`}
              onClick={() => setCanvasSize(s.id)}
            >
              <strong>{s.label}</strong>
              <span>{s.dims}</span>
            </button>
          ))}
        </div>
        <div className="bp-row">
          <label className="bp-bg">
            Background
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
          </label>
          <button className="primary sm" onClick={create}>Create blank canvas</button>
          <button className="ghost sm" onClick={pasteFromClipboard}>📋 Add from clipboard</button>
        </div>
      </div>
    </div>
  );
}

function EmptyCanvas({ onDropImage, onPick, notify }) {
  const [over, setOver] = React.useState(false);
  const { t } = useI18n();
  const handleDrop = async (e) => {
    e.preventDefault();
    setOver(false);
    const file = [...(e.dataTransfer?.files || [])].find((f) => f.type.startsWith('image/'));
    if (!file) { notify?.('Drop an image file'); return; }
    const url = URL.createObjectURL(file);
    onDropImage({ name: file.name, url, size: file.size });
  };
  return (
    <div
      className={`artboard empty-canvas${over ? ' drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onClick={onPick}
    >
      <div className="empty-inner">
        <div className="empty-icon">⇩</div>
        <h2>{t('Drop image here')}</h2>
        <p>{t('or click to browse · paste from clipboard · use Capture / Import')}</p>
        <button className="primary sm" onClick={(e) => { e.stopPropagation(); onPick?.(); }}>{t('Choose file')}</button>
      </div>
    </div>
  );
}

function EditorArtboard() {
  return (
    <div className="artboard">
      <div className="browser-chrome">
        <span /><span /><span />
        <div className="fake-url">app.frameflow.design/pricing?walkthrough=onboarding</div>
      </div>
      <div className="mock-screen">
        <div className="chart-card" />
        <div className="chart-grid">
          <div className="tile large" />
          <div className="tile" />
          <div className="tile" />
          <div className="tile wide" />
        </div>
        <div className="annotation step-one">1</div>
        <div className="annotation-line line-one" />
        <div className="note note-one"><strong>Detected step</strong><span>Open pricing analytics panel</span></div>
        <div className="annotation step-two">2</div>
        <div className="annotation-line line-two" />
        <div className="note note-two"><strong>Smart OCR</strong><span>Editable text region found</span></div>
        <div className="focus-ring" />
      </div>
    </div>
  );
}

const libraryAssets = [
  { tag: 'All Assets', featured: true, tone: 'gradient-a', title: 'Headphones Hero 04', text: 'Transparent PNG • Approved • 4 variants', approved: true, duplicate: false, ocr: false },
  { tag: 'OCR Hits', tone: 'gradient-b', title: 'Checkout Walkthrough', text: 'OCR indexed • 9 steps • Share link', approved: false, duplicate: false, ocr: true },
  { tag: 'All Assets', tone: 'gradient-c', title: 'Studio Bottle 12', text: 'AVIF + WEBP preset • Needs review', approved: false, duplicate: false, ocr: false },
  { tag: 'Approved', tone: 'gradient-d', title: 'Campaign Banner Crop', text: 'Version 7 • Social preset • Comments 3', approved: true, duplicate: false, ocr: false },
  { tag: 'OCR Hits', tone: 'gradient-e', title: 'Pricing Capture Full Page', text: 'Scrolling capture • Text editable', approved: false, duplicate: false, ocr: true },
  { tag: 'Duplicates', tone: 'gradient-f', title: 'Duplicate Group 18', text: '6 similar assets • Merge suggestion ready', approved: false, duplicate: true, ocr: false },
];

function LibraryScreen() {
  const [collection, setCollection] = useState('launch');
  const [filter, setFilter] = useState('All Assets');
  const notify = useToast();

  const filtered = libraryAssets.filter((a) => {
    if (filter === 'All Assets') return true;
    if (filter === 'Duplicates') return a.duplicate;
    if (filter === 'OCR Hits') return a.ocr;
    if (filter === 'Approved') return a.approved;
    return true;
  });

  return (
    <section className="screen-shell">
      <aside className="screen-sidebar panel">
        <div className="panel-header"><h3>Collections</h3><span>128</span></div>
        {[
          { id: 'launch', title: 'Launch Assets', text: 'Tagged, approved, brand-safe' },
          { id: 'onboarding', title: 'Onboarding Captures', text: 'OCR indexed, step-guide ready' },
          { id: 'spring', title: 'Spring Campaign', text: 'Variants, review notes, exports' },
        ].map((c) => (
          <button
            key={c.id}
            className={`rail-item${collection === c.id ? ' active' : ''}`}
            onClick={() => { setCollection(c.id); notify(`Opened ${c.title}`); }}
          >
            <strong>{c.title}</strong><span>{c.text}</span>
          </button>
        ))}
        <div className="panel-divider" />
        <InspectorCard eyebrow="Search System" title="Metadata-first browsing" text="Ratings, tags, OCR text, AI keywords, duplicates, and people/product grouping." />
      </aside>
      <section className="screen-main">
        <Panel className="screen-toolbar">
          <div className="toolbar-title"><p className="eyebrow">Asset Library</p><h3>Find the right image fast, then branch into edits or exports</h3></div>
          <ToolBar tools={['All Assets', 'Duplicates', 'OCR Hits', 'Approved']} value={filter} onSelect={setFilter} />
        </Panel>
        <div className="library-overview">
          <MetricPanel label="Indexed Assets" value="12,482" />
          <MetricPanel label="Detected Duplicates" value="184 groups" />
          <MetricPanel label="Saved Presets" value="37" />
          <MetricPanel label="Ready For Review" value="52" />
        </div>
        <Panel className="library-board">
          <div className="library-header"><div><p className="eyebrow">Smart Query</p><h4>Filter: {filter}</h4></div><div className="status-badge">{filtered.length} results</div></div>
          <div className="library-grid">
            {filtered.length === 0 ? <p style={{ color: 'var(--muted)' }}>No assets match this filter.</p> :
              filtered.map((a) => (
                <AssetCard key={a.title} featured={a.featured} tone={a.tone} title={a.title} text={a.text} />
              ))
            }
          </div>
        </Panel>
      </section>
    </section>
  );
}

function JobsScreen() {
  const [filter, setFilter] = useState('Running');
  const jobs = [
    { tone: 'running', filterKey: 'Running', label: 'Running', title: 'Marketplace Product Cleanup', status: '62% complete', progress: '62', text: 'Remove backgrounds, normalize lighting, generate square/portrait variants, and export AVIF + PNG.', tags: ['124 assets', 'AI Masking', '3 export presets'] },
    { tone: 'queued', filterKey: 'Queued', label: 'Queued', title: 'Help Center Screenshot Pass', status: 'Starts next', text: 'Apply brand theme, number detected steps, blur personal data, and publish documentation review links.', tags: ['48 captures', 'OCR + Redact', 'Guide template'] },
    { tone: 'failed', filterKey: 'Failed', label: 'Needs Attention', title: 'Retail Catalog Resize', status: '3 errors', text: 'Three source files have missing fonts and one image exceeded the transparency export rule.', tags: ['Open error bundle', 'Retry failed only', 'Save fix as preset'] },
    { tone: 'queued', filterKey: 'Completed', label: 'Completed', title: 'Avatar Batch v4', status: '100%', text: 'Resized and cropped 412 avatars across 3 size presets.', tags: ['412 assets', 'Done 2h ago'] },
  ];
  const visible = jobs.filter((j) => j.filterKey === filter);
  return (
    <section className="screen-shell jobs-layout">
      <section className="screen-main">
        <Panel className="screen-toolbar">
          <div className="toolbar-title"><p className="eyebrow">Batch Jobs</p><h3>Move heavy processing off the critical path, but keep it visible</h3></div>
          <ToolBar tools={['Running', 'Queued', 'Failed', 'Completed']} value={filter} onSelect={setFilter} />
        </Panel>
        <div className="jobs-stack">
          {visible.length === 0 ? <p style={{ color: 'var(--muted)' }}>No {filter.toLowerCase()} jobs.</p> :
            visible.map((j) => <JobCard key={j.title} {...j} />)}
        </div>
      </section>
      <aside className="screen-sidebar panel">
        <div className="panel-header"><h3>Job Recipe</h3><span>Reusable</span></div>
        <ListCard eyebrow="Pipeline" items={['Detect duplicate assets', 'Apply AI masking', 'Run quality rules', 'Generate variants', 'Export by destination']} />
        <InspectorCard eyebrow="Why it matters" title="Calm async workflow" text="The browser app should feel calm during heavy work. Jobs run in the background, results stay traceable, and failures are recoverable." />
      </aside>
    </section>
  );
}

function ExportsScreen() {
  const [filter, setFilter] = useState('Web');
  const presets = [
    { tag: 'Web', featured: true, eyebrow: 'Default Team Preset', title: 'Product Launch Bundle', text: 'Exports AVIF, PNG transparency, review PDF, and a signed share link in one action.', tags: ['Hero 2400px', 'Square 1600px', 'Watermark off', 'Color profile locked'] },
    { tag: 'Docs', eyebrow: 'Docs', title: 'Help Center Guide', text: 'PNG + PDF bundle with numbered steps, OCR text, and blur rules.' },
    { tag: 'Review', eyebrow: 'Review', title: 'Stakeholder Link', text: 'Interactive review page with compare enabled and comments open.' },
    { tag: 'Marketplace', eyebrow: 'Commerce', title: 'Marketplace Sync', text: 'Transparent PNG, white JPG fallback, and mobile-safe crop variants.' },
  ];
  const visible = presets.filter((p) => p.tag === filter);
  return (
    <section className="screen-shell jobs-layout">
      <section className="screen-main">
        <Panel className="screen-toolbar">
          <div className="toolbar-title"><p className="eyebrow">Export Presets</p><h3>Map file output to real destinations, not just formats</h3></div>
          <ToolBar tools={['Web', 'Docs', 'Marketplace', 'Review']} value={filter} onSelect={setFilter} />
        </Panel>
        <div className="preset-grid">
          {visible.length === 0 ? <p style={{ color: 'var(--muted)' }}>No presets for {filter}.</p> :
            visible.map((p) => <PresetCard key={p.title} {...p} />)}
        </div>
      </section>
      <aside className="screen-sidebar panel">
        <div className="panel-header"><h3>Preset Rules</h3><span>Intent-aware</span></div>
        <InspectorCard eyebrow="Principle" title="Destination-first exports" text="Users should choose where an asset is going, and the app should infer the right output recipe." />
        <ListCard eyebrow="Included Controls" items={['Format bundles', 'Destination-specific sizes', 'Metadata retention rules', 'Approval gates before export']} />
      </aside>
    </section>
  );
}

function VersionsScreen() {
  return (
    <section className="screen-shell jobs-layout">
      <section className="screen-main">
        <Panel className="screen-toolbar">
          <div className="toolbar-title"><p className="eyebrow">Version History</p><h3>Keep edits reversible, comparable, and safe for teams</h3></div>
          <ToolBar tools={['Timeline', 'Compare', 'Restore']} />
        </Panel>
        <Panel className="version-stage">
          <div className="version-compare">
            <div className="compare-card before"><p className="eyebrow">Version 6</p><h4>Before OCR cleanup</h4></div>
            <div className="compare-card after"><p className="eyebrow">Version 7</p><h4>After OCR + callout alignment</h4></div>
          </div>
          <div className="timeline-list">
            <TimelineItem active version="v7" text="OCR text fixed, callout moved, exported review link" />
            <TimelineItem version="v6" text="Blur regions adjusted and brand colors applied" />
            <TimelineItem version="v5" text="Initial scrolling capture stitched automatically" />
          </div>
        </Panel>
      </section>
      <aside className="screen-sidebar panel">
        <div className="panel-header"><h3>Safety Model</h3><span>Non-destructive</span></div>
        <ListCard eyebrow="What matters" items={['Original never overwritten', 'Operations stored as edit graph', 'Named milestones for review', 'Selective rollback']} />
      </aside>
    </section>
  );
}

function AiScreen() {
  return (
    <section className="screen-shell jobs-layout">
      <section className="screen-main">
        <Panel className="screen-toolbar">
          <div className="toolbar-title"><p className="eyebrow">AI Assist</p><h3>Use AI for the boring parts, while keeping the human in charge</h3></div>
          <ToolBar tools={['Suggestions', 'Redact', 'Mask', 'Rewrite']} />
        </Panel>
        <div className="ai-grid">
          <AiCard eyebrow="Detected Opportunity" title="Generate step guide from capture" text="Found 6 likely interaction steps and 3 editable text regions." tags={['Apply steps', 'Preview first']} />
          <AiCard eyebrow="Sensitive Data" title="Smart redact suggestion" text="Detected email addresses and account IDs inside the screenshot." tags={['Blur', 'Redact permanently']} />
          <AiCard eyebrow="Photo Workflow" title="Mask subject and relight background" text="Recommended for 24 catalog images with uneven lighting." tags={['Create batch job', 'Save as preset']} />
        </div>
      </section>
      <aside className="screen-sidebar panel">
        <div className="panel-header"><h3>AI Principles</h3><span>Assistive</span></div>
        <ListCard eyebrow="Guardrails" items={['Show previews before apply', 'Expose confidence for risky actions', 'Prefer suggestions over silent edits', 'Always allow manual override']} />
      </aside>
    </section>
  );
}

function ReviewScreen({ publishedLink }) {
  const notify = useToast();
  const copy = async () => {
    if (!publishedLink) { notify('No link published yet'); return; }
    try { await navigator.clipboard.writeText(publishedLink); notify('Link copied'); } catch { notify(publishedLink); }
  };
  return (
    <section className="review-shell panel">
      <div className="review-topbar">
        <div>
          <p className="eyebrow">Review Link</p>
          <h3>Checkout Flow Markup v7</h3>
          {publishedLink && (
            <div className="review-link-row">
              <code>{publishedLink}</code>
              <button className="tool" onClick={copy}>Copy</button>
            </div>
          )}
        </div>
        <ToolBar tools={['Comment', 'Compare', 'Approve']} />
      </div>
      <div className="review-layout">
        <section className="review-canvas"><div className="review-art"><div className="review-image"><div className="review-pin pin-one">1</div><div className="review-pin pin-two">2</div><div className="review-pin pin-three">3</div></div></div></section>
        <aside className="review-sidebar">
          <InspectorCard eyebrow="Summary" title="Ready for stakeholder sign-off" text="This screen treats review as a first-class destination: contextual comments, version compare, and explicit approval state." />
          <section className="inspector-group">
            <p className="eyebrow">Threaded Notes</p>
            <Comment name="Mina" text="Pin 1: copy is much clearer after OCR edit. Good to approve." />
            <Comment name="Jules" text="Pin 2: keep the callout style, but move it 12px lower." />
            <Comment name="Rafi" text="Pin 3: export both PNG and review PDF once approved." />
          </section>
          <ListCard eyebrow="Decision State" items={['2 approvals received', '1 change request open', 'Compare against v6 available', 'Export preset attached']} />
        </aside>
      </div>
    </section>
  );
}

function MiniCard({ tone, eyebrow, title, text }) {
  return <div className={`mini-card ${tone}`}><p className="eyebrow">{eyebrow}</p><h4>{title}</h4><span>{text}</span></div>;
}

function StripCard({ eyebrow, title, text }) {
  return <article className="panel strip-card"><p className="eyebrow">{eyebrow}</p><h4>{title}</h4><span>{text}</span></article>;
}

function InspectorCard({ eyebrow, title, text }) {
  return <section className="inspector-group"><p className="eyebrow">{eyebrow}</p><h4>{title}</h4><p>{text}</p></section>;
}

function ListCard({ eyebrow, items }) {
  return <section className="inspector-group"><p className="eyebrow">{eyebrow}</p><ul className="principles">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}

function Comment({ name, text }) {
  return <div className="comment"><strong>{name}</strong><span>{text}</span></div>;
}

function MetricPanel({ label, value }) {
  return <article className="panel stat-panel"><span>{label}</span><strong>{value}</strong></article>;
}

function AssetCard({ featured = false, tone, title, text }) {
  const notify = useToast();
  return (
    <article
      className={`asset-card${featured ? ' featured' : ''}`}
      onClick={() => notify(`Opened ${title}`)}
      role="button"
      tabIndex={0}
    >
      <div className={`asset-thumb ${tone}`} />
      <div className="asset-meta"><strong>{title}</strong><span>{text}</span></div>
    </article>
  );
}

function JobCard({ tone, label, title, status, progress, text, tags }) {
  const notify = useToast();
  return (
    <article className={`panel job-card ${tone}`}>
      <div className="job-topline"><div><p className="eyebrow">{label}</p><h4>{title}</h4></div><div className="status-badge">{status}</div></div>
      <p>{text}</p>
      {progress ? <div className="progress-track"><div className="progress-bar" style={{ width: `${progress}%` }} /></div> : null}
      <div className="job-tags">{tags.map((tag) => (
        <button key={tag} className="chip" onClick={() => notify(tag)}>{tag}</button>
      ))}</div>
    </article>
  );
}

function PresetCard({ featured = false, eyebrow, title, text, tags = [] }) {
  const notify = useToast();
  return (
    <article className={`panel preset-card${featured ? ' featured-preset' : ''}`} onClick={() => notify(`Applied ${title}`)} role="button" tabIndex={0}>
      <p className="eyebrow">{eyebrow}</p><h4>{title}</h4><p>{text}</p>
      {tags.length ? <div className="job-tags">{tags.map((tag) => <span key={tag} className="chip static">{tag}</span>)}</div> : null}
    </article>
  );
}

function TimelineItem({ active = false, version, text }) {
  const notify = useToast();
  return (
    <button className={`timeline-item${active ? ' active' : ''}`} onClick={() => notify(`Restored ${version}`)}>
      <strong>{version}</strong><span>{text}</span>
    </button>
  );
}

function AiCard({ eyebrow, title, text, tags }) {
  const notify = useToast();
  return (
    <article className="panel ai-card suggestion">
      <p className="eyebrow">{eyebrow}</p><h4>{title}</h4><p>{text}</p>
      <div className="job-tags">{tags.map((tag, i) => (
        <button key={tag} className={`chip${i === 0 ? ' chip-primary' : ''}`} onClick={() => notify(`${tag}: ${title}`)}>{tag}</button>
      ))}</div>
    </article>
  );
}

export default App;
