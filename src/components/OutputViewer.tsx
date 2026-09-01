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
  ShieldCheck
} from 'lucide-react';
import { ASNData, XMLFormatType } from '../types/asn';
import { generateXMLByFormat } from '../utils/xmlGenerator';
import { generateEDIFACTDESADV } from '../utils/edifactGenerator';

interface OutputViewerProps {
  data: ASNData;
  selectedFormat: XMLFormatType;
  onSelectFormat: (format: XMLFormatType) => void;
  copied: boolean;
  onCopyText: (text: string) => void;
  onDownloadFile: (filename: string, content: string, mimeType: string) => void;
}

type TabType = 'xml' | 'edifact' | 'summary';

export const OutputViewer: React.FC<OutputViewerProps> = ({
  data,
  selectedFormat,
  onSelectFormat,
  copied,
  onCopyText,
  onDownloadFile
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('xml');
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
    }
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

          <button
            type="button"
            id="tab-btn-summary"
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Karta Przewozowa</span>
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
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
              title="Wybierz standard schematu XML"
            >
              <option value="standard-xml">Standard UBL/EDI-XML (DESADV)</option>
              <option value="automotive-vda">Automotive VDA 4987 XML</option>
              <option value="erp-canonical">ERP / SAP IDoc XML</option>
            </select>
          )}

          {/* Copy Button */}
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

          {/* Download File Button */}
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
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'summary' ? (
        /* Summary Dashboard view */
        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Numer ASN / WZ</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {data.header.asnNumber}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">WZ: {data.header.deliveryNoteRef}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Łączna ilość sztuk</span>
              <span className="text-base font-bold text-blue-700 font-mono">
                {totalUnits} PCE
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">w {totalPackages} opakowaniach</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Masa Brutto / Netto</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {data.header.grossWeightKg.toFixed(1)} kg
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Netto: {data.header.netWeightKg.toFixed(1)} kg</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Rozładunek / Brama</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {data.header.unloadingPoint || 'Brak'}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Przewoźnik: {data.header.carrierCode}</span>
            </div>
          </div>

          {/* Shipping Manifest table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-700 uppercase tracking-wider">
              Wykaz Opakowań i Etykiet GIR
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3">CPS</th>
                  <th className="py-2.5 px-3">Etykieta GIR (Handling Unit)</th>
                  <th className="py-2.5 px-3">Kod Części (LIN)</th>
                  <th className="py-2.5 px-3 text-center">Opakowania</th>
                  <th className="py-2.5 px-3 text-center">Ilość sztuk</th>
                  <th className="py-2.5 px-3">Zlecenie PO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {data.items.map(it => (
                  <tr key={it.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{it.cpsSequence}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {it.girPrefix}-{it.girSerial}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold">{it.partNumber}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{it.packageCount} × {it.packageType} ({it.qtyPerPackage} szt.)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">{it.totalQuantity} {it.unitOfMeasure}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{it.orderNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
