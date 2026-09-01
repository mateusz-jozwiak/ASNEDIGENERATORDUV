import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Code
} from 'lucide-react';
import { parseEDIFACTDESADV } from '../utils/edifactParser';
import { ASNData } from '../types/asn';
import { RAW_SAMPLE_EDIFACT } from '../utils/sampleData';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: ASNData) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [rawText, setRawText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleParseAndImport = (textToParse: string) => {
    setErrorMsg(null);
    setWarnings([]);

    if (!textToParse.trim()) {
      setErrorMsg('Wprowadź lub wklej treść pliku EDIFACT.');
      return;
    }

    try {
      const { data, warnings: parseWarnings } = parseEDIFACTDESADV(textToParse);
      setWarnings(parseWarnings);
      onImportSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Wystąpił błąd podczas parsowania pliku EDIFACT.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      handleParseAndImport(content);
    };
    reader.onerror = () => {
      setErrorMsg('Nie udało się odczytać wybranego pliku.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      handleParseAndImport(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setRawText(RAW_SAMPLE_EDIFACT);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Import EDIFACT DESADV
            </h3>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              Wczytaj istniejący komunikat lub wklej treść
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          
          {/* Drag & drop upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
            }`}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".edi,.txt,.xml,.dat"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-7 h-7 text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800">
              Kliknij aby wybrać plik lub upuść go tutaj
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Obsługiwane formaty: .edi, .txt, .dat (UN/EDIFACT D96A/D97A DESADV)
            </p>
          </div>

          {/* Paste Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Lub wklej bezpośrednio tekst komunikatu EDIFACT:
              </label>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Wklej przykład
              </button>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="UNB+UNOA:3+5900000035314+O0177X1JQEDILOG-HOR::2674+260827:1049+1++DESADV'&#10;UNH+1+DESADV:D:96A:UN'&#10;BGM+351+00034'..."
              rows={7}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Error / Warning feedback */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Uwagi:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Anuluj
          </button>

          <button
            type="button"
            id="btn-confirm-parse"
            onClick={() => handleParseAndImport(rawText)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <span>Przetwórz i załaduj do ASN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
