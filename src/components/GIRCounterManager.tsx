import React from 'react';
import { 
  Hash, 
  RefreshCw, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Settings2, 
  Sliders, 
  HelpCircle, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Check 
} from 'lucide-react';
import { GIRConfig, ASNItemLine } from '../types/asn';
import { formatGIRSerial } from '../utils/girCounter';

interface GIRCounterManagerProps {
  girConfig: GIRConfig;
  onChangeGirConfig: (config: GIRConfig) => void;
  onApplySequentialGIR: () => void;
  items: ASNItemLine[];
}

export const GIRCounterManager: React.FC<GIRCounterManagerProps> = ({
  girConfig,
  onChangeGirConfig,
  onApplySequentialGIR,
  items
}) => {
  const [isOpenSettings, setIsOpenSettings] = React.useState(false);

  const totalPackages = items.reduce((acc, it) => acc + (Number(it.packageCount) || 0), 0);
  const previewSerial = formatGIRSerial(girConfig.currentNumber, girConfig.padding);
  const sampleGIRSegment = `GIR+${girConfig.typeQualifier}+${girConfig.prefix}+${previewSerial}+${girConfig.codeType1}+${girConfig.codeType2}'`;

  const handleIncrement = (amount: number) => {
    onChangeGirConfig({
      ...girConfig,
      currentNumber: Math.max(1, girConfig.currentNumber + amount)
    });
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-full border border-slate-800">
      
      {/* Background Graphic Watermark */}
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none select-none">
        <svg width="140" height="140" viewBox="0 0 24 24" fill="white">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
        </svg>
      </div>

      <div className="relative z-10 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Hash className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Automatyczny Licznik GIR (SSCC)
            </h2>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              id="btn-toggle-gir-settings"
              onClick={() => setIsOpenSettings(!isOpenSettings)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isOpenSettings 
                  ? 'bg-slate-800 text-blue-300 border-blue-500/40' 
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
              title="Konfiguracja prefiksu GS1 i formatu GIR"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isOpenSettings ? 'Ukryj opcje' : 'Opcje prefiksu'}</span>
              {isOpenSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Hero Metric: Big Next ID */}
        <div className="flex flex-wrap items-baseline justify-between gap-3 pt-1">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-blue-400 tracking-tight">
                {previewSerial}
              </span>
              <span className="text-xs font-medium text-slate-400">Startowy numer</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-mono">
              <span className="text-slate-500">Prefiks firmy:</span>
              <span className="text-slate-300 font-semibold">{girConfig.prefix}</span>
            </div>
          </div>

          {/* Quick Counter Step Controls */}
          <div className="flex items-center bg-slate-800/90 rounded-xl border border-slate-700/80 p-1 shadow-inner">
            <button
              id="btn-gir-minus"
              onClick={() => handleIncrement(-1)}
              className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Zmniejsz licznik o 1"
            >
              -1
            </button>
            <span className="px-2.5 text-xs font-mono font-bold text-blue-300 border-x border-slate-700/60">
              #{girConfig.currentNumber}
            </span>
            <button
              id="btn-gir-plus"
              onClick={() => handleIncrement(1)}
              className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Zwiększ licznik o 1"
            >
              +1
            </button>
          </div>
        </div>

        {/* Info label */}
        <p className="text-xs text-slate-400 leading-relaxed">
          Generuje ciągły ciąg unikalnych numerów etykiet <code className="text-blue-300 font-mono">GIR+3+...</code> dla każdego kartonu (łącznie {totalPackages} etykiet w tej wysyłce).
        </p>

        {/* Action button */}
        <div className="pt-1">
          <button
            id="btn-apply-gir-all"
            onClick={onApplySequentialGIR}
            className="w-full inline-flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 transition-all cursor-pointer"
            title="Przypisz kolejne numery seryjne GIR do wszystkich pozycji w tabeli"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Przelicz GIR dla wszystkich pozycji ({items.length} poz. / {totalPackages} kartonów)</span>
          </button>
        </div>
      </div>

      {/* Expandable Configuration Panel */}
      {isOpenSettings && (
        <div className="mt-4 pt-4 border-t border-slate-800/90 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in duration-200 relative z-10">
          <div>
            <label className="block text-slate-400 mb-1 text-[11px] font-medium">Prefiks firmy (GS1):</label>
            <input
              id="input-gir-prefix"
              type="text"
              value={girConfig.prefix}
              onChange={(e) => onChangeGirConfig({ ...girConfig, prefix: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-blue-500 focus:outline-none"
              placeholder="np. 5900000035314"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 text-[11px] font-medium">Numer startowy:</label>
            <input
              id="input-gir-number"
              type="number"
              value={girConfig.currentNumber}
              onChange={(e) => onChangeGirConfig({ ...girConfig, currentNumber: Math.max(1, parseInt(e.target.value || '1', 10)) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 text-[11px] font-medium">Długość cyfr (Padding zer):</label>
            <select
              id="select-gir-padding"
              value={girConfig.padding}
              onChange={(e) => onChangeGirConfig({ ...girConfig, padding: parseInt(e.target.value, 10) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="6">6 cyfr (np. 005006)</option>
              <option value="8">8 cyfr (standard: np. 00005006)</option>
              <option value="9">9 cyfr (np. 000005006)</option>
              <option value="10">10 cyfr (np. 0000005006)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 text-[11px] font-medium">Kwalifikatory EDI (UN + 1J):</label>
            <div className="flex space-x-1.5">
              <input
                type="text"
                value={girConfig.codeType1}
                onChange={(e) => onChangeGirConfig({ ...girConfig, codeType1: e.target.value })}
                className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-center font-mono text-xs focus:border-blue-500 focus:outline-none"
                title="Kwalifikator 1 (np. UN)"
              />
              <input
                type="text"
                value={girConfig.codeType2}
                onChange={(e) => onChangeGirConfig({ ...girConfig, codeType2: e.target.value })}
                className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-center font-mono text-xs focus:border-blue-500 focus:outline-none"
                title="Kwalifikator 2 (np. 1J)"
              />
            </div>
          </div>

          <div className="sm:col-span-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono truncate mr-2">
              EDI: <code className="text-blue-300 font-semibold">{sampleGIRSegment}</code>
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Auto-zapis
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
