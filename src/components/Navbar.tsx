import React from 'react';
import { 
  FileCode2, 
  Upload, 
  Download, 
  Copy, 
  PlusCircle, 
  RotateCcw, 
  Sparkles, 
  Check, 
  FileText, 
  ShieldCheck, 
  CheckCircle 
} from 'lucide-react';
import { XMLFormatType } from '../types/asn';

interface NavbarProps {
  onNewASN: () => void;
  onLoadSample: () => void;
  onOpenImport: () => void;
  onExportXML: () => void;
  onExportEDI: () => void;
  onCopyXML: () => void;
  copied: boolean;
  selectedFormat: XMLFormatType;
  onSelectFormat: (format: XMLFormatType) => void;
  hasErrors: boolean;
  itemCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewASN,
  onLoadSample,
  onOpenImport,
  onExportXML,
  onExportEDI,
  onCopyXML,
  copied,
  selectedFormat,
  onSelectFormat,
  hasErrors,
  itemCount
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-xs">
              <span className="text-white font-bold text-xs tracking-wider">ASN</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">
                  EDIXpress <span className="text-blue-600">Gen-Pro</span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                  DESADV D96A
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Generator awizacji wysyłki XML & EDIFACT z inteligentnym licznikiem GIR
              </p>
            </div>
          </div>

          {/* Right Actions & Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Status Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>System Aktywny ({itemCount} {itemCount === 1 ? 'pozycja' : 'pozycji'})</span>
            </div>

            {/* Load Sample button */}
            <button
              id="btn-load-sample"
              onClick={onLoadSample}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Wczytaj przykładowe dane z zapytania (Orsamoto / Duvenbeck)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Wczytaj przykład</span>
            </button>

            {/* Import EDI/TXT button */}
            <button
              id="btn-import-edi"
              onClick={onOpenImport}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Importuj EDI</span>
            </button>

            {/* New ASN button */}
            <button
              id="btn-new-asn"
              onClick={onNewASN}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Nowe ASN</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Copy XML Button */}
            <button
              id="btn-copy-xml"
              onClick={onCopyXML}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors"
              title="Kopiuj wygenerowany kod XML do schowka"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline">{copied ? 'Skopiowano!' : 'Kopiuj XML'}</span>
            </button>

            {/* Export XML Button */}
            <button
              id="btn-export-xml"
              onClick={onExportXML}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generuj XML</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
