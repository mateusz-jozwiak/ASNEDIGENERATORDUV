import React, { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Wand2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { ValidationError } from '../types/asn';

interface ValidationBannerProps {
  errors: ValidationError[];
  onAutoFixAll: () => void;
}

export const ValidationBanner: React.FC<ValidationBannerProps> = ({
  errors,
  onAutoFixAll
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const errorList = errors.filter(e => e.type === 'error');
  const warningList = errors.filter(e => e.type === 'warning');

  if (errors.length === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
              Walidacja poprawna — brak błędów
            </span>
            <span className="text-xs text-emerald-700">
              Wszystkie pola nagłówka, ilości, wagi oraz unikalne numery GIR są zgodne ze standardem DESADV.
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
          Gotowe do generowania XML
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border shadow-xs overflow-hidden transition ${
      errorList.length > 0
        ? 'bg-rose-50/70 border-rose-200'
        : 'bg-amber-50/70 border-amber-200'
    }`}>
      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            errorList.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {errorList.length > 0 ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Wykryto {errorList.length > 0 ? `${errorList.length} błędów` : ''} {warningList.length > 0 ? `${warningList.length} ostrzeżeń` : ''}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                (Asystent poprawności danych EDI/XML)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Kliknij aby zobaczyć szczegóły lub użyj automatycznej naprawy, aby uniknąć odrzucenia dokumentu.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onAutoFixAll}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Napraw automatycznie</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/60 transition cursor-pointer"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-5 pb-4 pt-2 border-t border-slate-200/60 space-y-2 text-xs bg-white/40">
          {errorList.map((err) => (
            <div key={err.id} className="flex items-center space-x-2 text-rose-800">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{err.message}</span>
            </div>
          ))}
          {warningList.map((warn) => (
            <div key={warn.id} className="flex items-center space-x-2 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>{warn.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
