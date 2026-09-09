import React, { useState } from 'react';
import { 
  Code2, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  FileSpreadsheet, 
  Sparkles, 
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  FileDown,
  Printer,
  Truck,
  Building2,
  Calendar,
  Scale
} from 'lucide-react';
import { ASNData, XMLFormatType } from '../types/asn';
import { generateXMLByFormat } from '../utils/xmlGenerator';
import { generateEDIFACTDESADV } from '../utils/edifactGenerator';
import { getGIRRangeText } from '../utils/girCounter';

interface OutputViewerProps {
  data: ASNData;
  selectedFormat: XMLFormatType;
  onSelectFormat: (format: XMLFormatType) => void;
  copied: boolean;
  onCopyText: (text: string) => void;
  onDownloadFile: (filename: string, content: string, mimeType: string) => void;
  onDownloadPDF: () => void;
}

type TabType = 'xml' | 'edifact' | 'summary';

export const OutputViewer: React.FC<OutputViewerProps> = ({
  data,
  selectedFormat,
  onSelectFormat,
  copied,
  onCopyText,
  onDownloadFile,
  onDownloadPDF
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [searchTerm, setSearchTerm] = useState('');

  const generatedXml = generateXMLByFormat(data, selectedFormat);
  const generatedEdifact = generateEDIFACTDESADV(data);

  const totalPackages = data.items.reduce((sum, it) => sum + (Number(it.packageCount) || 0), 0);
  const totalUnits = data.items.reduce((sum, it) => sum + (Number(it.totalQuantity) || 0), 0);

  const handleDownloadActive = () => {
    if (activeTab === 'xml') {
      const filename = `ASN_${data.header.asnNumber || 'DESADV'}_${selectedFormat}.xml`;
      onDownloadFile(filename, generatedXml, 'application/xml');
    } else if (activeTab === 'edifact') {
      const filename = `DESADV_${data.header.asnNumber || '00034'}.edi`;
      onDownloadFile(filename, generatedEdifact, 'text/plain');
    } else if (activeTab === 'summary') {
      onDownloadPDF();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyActive = () => {
    const textToCopy = activeTab === 'edifact' ? generatedEdifact : generatedXml;
    onCopyText(textToCopy);
  };

  const currentCode = activeTab === 'edifact' ? generatedEdifact : generatedXml;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Top Header & Tab switcher */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        
        {/* Main Tabs */}
        <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-xl">
          <button
            type="button"
            id="tab-btn-summary"
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" />
            <span>Karta Przewozowa (PDF)</span>
          </button>

          <button
            type="button"
            id="tab-btn-xml"
            onClick={() => setActiveTab('xml')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'xml'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Format XML</span>
          </button>

          <button
            type="button"
            id="tab-btn-edifact"
            onClick={() => setActiveTab('edifact')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'edifact'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>EDIFACT (DESADV)</span>
          </button>
        </div>

        {/* Right action tools */}
        <div className="flex items-center space-x-2">
          
          {/* XML Format Sub-selector (only active on xml tab) */}
          {activeTab === 'xml' && (
            <select
              id="select-xml-format"
              value={selectedFormat}
              onChange={(e) => onSelectFormat(e.target.value as XMLFormatType)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none cursor-pointer"
              title="Wybierz standard schematu XML"
            >
              <option value="standard-xml">Standard UBL/EDI-XML (DESADV)</option>
              <option value="automotive-vda">Automotive VDA 4987 XML</option>
              <option value="erp-canonical">ERP / SAP IDoc XML</option>
            </select>
          )}

          {/* Copy Button for code tabs */}
          {activeTab !== 'summary' && (
            <button
              type="button"
              onClick={handleCopyActive}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Skopiowano!' : 'Kopiuj'}</span>
            </button>
          )}

          {/* Download File Button for code tabs */}
          {activeTab !== 'summary' && (
            <button
              type="button"
              onClick={handleDownloadActive}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{activeTab === 'xml' ? 'Pobierz XML' : 'Pobierz EDI'}</span>
            </button>
          )}

          {/* Action buttons for Summary / Consignment Note tab */}
          {activeTab === 'summary' && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                title="Wydrukuj dokument"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Drukuj</span>
              </button>

              <button
                type="button"
                id="btn-download-pdf-tab"
                onClick={onDownloadPDF}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                title="Pobierz Kartę Przewozową w formacie PDF (A4)"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Pobierz Kartę (PDF)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'summary' ? (
        /* Enhanced Consignment Note Document View */
        <div className="p-5 sm:p-7 space-y-6">
          
          {/* Action Hero Banner for PDF download */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                  Dokument Przewozowy A4
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ASN: {data.header.asnNumber} • WZ: {data.header.deliveryNoteRef || data.header.asnNumber}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Karta Przewozowa / Wykaz Załadunku (DESADV D96A)
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl">
                Oficjalny dokument załadunkowy z wykazem etykiet logistycznych GIR, masą ładunku i danymi przewoźnika.
              </p>
            </div>

            <div className="flex items-center space-x-2.5 shrink-0">
              <button
                type="button"
                id="btn-hero-download-pdf"
                onClick={onDownloadPDF}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Pobierz PDF (Gotowy do druku)</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Nadawca */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-1.5 mb-2">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">1. Nadawca (Consignor)</span>
              </div>
              <span className="text-sm font-bold text-slate-900 block truncate">
                {data.header.consignor.name || 'ORSAMOTO SP. Z O.O.'}
              </span>
              <span className="text-xs text-slate-600 block mt-0.5">Kod: <span className="font-mono">{data.header.consignor.code || '5900000035314'}</span></span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {[
                  data.header.consignor.street,
                  [data.header.consignor.postalCode, data.header.consignor.city].filter(Boolean).join(' '),
                  data.header.consignor.countryCode ? `(${data.header.consignor.countryCode})` : ''
                ].filter(Boolean).join(', ') || 'Polska (PL)'}
              </span>
            </div>

            {/* Card 2: Odbiorca */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-1.5 mb-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">2. Odbiorca (Consignee)</span>
              </div>
              <span className="text-sm font-bold text-slate-900 block truncate">
                {data.header.consignee.name || 'DUVENBECK LOGISTIK GMBH'}
              </span>
              <span className="text-xs text-slate-600 block mt-0.5">Brama / Rozładunek: <span className="font-mono font-bold text-blue-700">{data.header.unloadingPoint || '57U'}</span></span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {[
                  data.header.consignee.street,
                  [data.header.consignee.postalCode, data.header.consignee.city].filter(Boolean).join(' '),
                  data.header.consignee.countryCode ? `(${data.header.consignee.countryCode})` : ''
                ].filter(Boolean).join(', ') || 'Niemcy (DE)'}
              </span>
            </div>

            {/* Card 3: Transport */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-1.5 mb-2">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">3. Transport & Przewoźnik</span>
              </div>
              <span className="text-sm font-bold text-slate-900 block font-mono">
                {data.header.carrierCode || '1234567'}
              </span>
              <span className="text-xs text-slate-600 block mt-0.5">Pojazd: <span className="font-semibold">{data.header.vehiclePlate || 'Drogowy (TDT 3)'}</span></span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Wysyłka: {data.header.despatchDate ? data.header.despatchDate.replace('T', ' ') : '—'}
              </span>
            </div>

            {/* Card 4: Wagi i Opakowania */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-1.5 mb-2">
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">4. Waga & Opakowania</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {data.header.grossWeightKg.toFixed(1)} kg
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  (Netto: {data.header.netWeightKg.toFixed(1)} kg)
                </span>
              </div>
              <span className="text-xs font-semibold text-blue-700 block mt-0.5">
                {totalPackages} kartonów • {totalUnits} PCE
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {data.items.length} pozycji w specyfikacji
              </span>
            </div>

          </div>

          {/* Shipping Manifest table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-3 font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Specyfikacja Ładunku i Etykiet GIR (Handling Units)</span>
              <span className="text-[11px] text-slate-500 font-normal normal-case">
                Suma: <strong className="text-slate-800 font-mono">{totalPackages}</strong> opakowań / <strong className="text-slate-800 font-mono">{totalUnits}</strong> sztuk
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Poz.</th>
                    <th className="py-2.5 px-3">Numer Części (LIN)</th>
                    <th className="py-2.5 px-3">Opis Towaru</th>
                    <th className="py-2.5 px-3 text-center">Opakowania</th>
                    <th className="py-2.5 px-3 text-center">Szt./Opak.</th>
                    <th className="py-2.5 px-3 text-center">Ilość Łączna</th>
                    <th className="py-2.5 px-3">Nr Zlecenia (PO)</th>
                    <th className="py-2.5 px-3">Zakres Etykiet GIR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {data.items.map(it => (
                    <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400 font-bold">{it.cpsSequence}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{it.partNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{it.partDescription || '—'}</td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                          {it.packageCount} × {it.packageType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{it.qtyPerPackage}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700">{it.totalQuantity} {it.unitOfMeasure}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{it.orderNumber}</td>
                      <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
                        {it.girPrefix && <span className="text-slate-400 font-normal">{it.girPrefix}-</span>}
                        <span className="font-semibold text-blue-700">{getGIRRangeText(it)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 uppercase text-[11px] text-slate-500">
                      Łącznie: {data.items.length} pozycji
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-900">
                      {totalPackages} opak.
                    </td>
                    <td></td>
                    <td className="py-2.5 px-3 text-center font-mono text-blue-800">
                      {totalUnits} szt.
                    </td>
                    <td></td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                      {totalPackages} etykiet jednostkowych
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* Code viewer with dark IDE look */
        <div className="relative bg-slate-950 text-slate-200 font-mono text-xs p-5 overflow-x-auto max-h-[500px]">
          <pre className="leading-relaxed select-all">
            <code>{currentCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
