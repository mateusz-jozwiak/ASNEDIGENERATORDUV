import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GIRCounterManager } from './components/GIRCounterManager';
import { ASNHeaderForm } from './components/ASNHeaderForm';
import { ASNItemsTable } from './components/ASNItemsTable';
import { OutputViewer } from './components/OutputViewer';
import { ImportModal } from './components/ImportModal';
import { ValidationBanner } from './components/ValidationBanner';
import { ASNData, ASNHeader, ASNItemLine, GIRConfig, XMLFormatType } from './types/asn';
import { DEFAULT_ASN_SAMPLE } from './utils/sampleData';
import { loadSavedGIRConfig, saveGIRConfig, assignSequentialGIRs, formatGIRSerial } from './utils/girCounter';
import { validateASN } from './utils/validator';
import { generateXMLByFormat } from './utils/xmlGenerator';
import { generateEDIFACTDESADV } from './utils/edifactGenerator';
import { generateConsignmentNotePDF } from './utils/pdfGenerator';
import { 
  FileText, 
  Sparkles, 
  ArrowDownCircle, 
  CheckCircle, 
  Layers, 
  ShieldAlert, 
  Wand2 
} from 'lucide-react';

export default function App() {
  // Initialize state with default sample
  const [data, setData] = useState<ASNData>(() => {
    const loadedGIR = loadSavedGIRConfig(DEFAULT_ASN_SAMPLE.girConfig);
    return {
      ...DEFAULT_ASN_SAMPLE,
      girConfig: loadedGIR
    };
  });

  const [selectedFormat, setSelectedFormat] = useState<XMLFormatType>('standard-xml');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto save GIR config to localStorage whenever it changes
  useEffect(() => {
    saveGIRConfig(data.girConfig);
  }, [data.girConfig]);

  // Validation
  const validationErrors = validateASN(data);
  const hasErrors = validationErrors.some(e => e.type === 'error');

  // Show temporary toast message
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Header change handler
  const handleHeaderChange = (header: ASNHeader) => {
    setData(prev => ({ ...prev, header }));
  };

  // Items change handler
  const handleItemsChange = (items: ASNItemLine[]) => {
    setData(prev => ({ ...prev, items }));
  };

  // GIR Config change handler
  const handleGIRConfigChange = (girConfig: GIRConfig) => {
    setData(prev => ({ ...prev, girConfig }));
  };

  // 1-Click apply sequential GIR numbers to all rows in table
  const handleApplySequentialGIR = () => {
    const { updatedItems, nextNumber } = assignSequentialGIRs(data.items, data.girConfig);
    setData(prev => ({
      ...prev,
      items: updatedItems,
      girConfig: {
        ...prev.girConfig,
        currentNumber: nextNumber
      }
    }));
    showToast(`Przeliczono i przypisano kolejne numery GIR (${data.items.length} pozycji)`);
  };

  // Auto-Fix all issues
  const handleAutoFixAll = () => {
    // 1. Recalculate quantities & fix CPS sequence
    let currentSeq = 1;
    const fixedItems = data.items.map((it, idx) => {
      const count = Math.max(1, it.packageCount || 1);
      const perPack = Math.max(1, it.qtyPerPackage || 1);
      return {
        ...it,
        cpsSequence: currentSeq++,
        packageCount: count,
        qtyPerPackage: perPack,
        totalQuantity: count * perPack,
        girPrefix: it.girPrefix || data.girConfig.prefix
      };
    });

    // 2. Re-sequence GIR serials
    const { updatedItems, nextNumber } = assignSequentialGIRs(fixedItems, data.girConfig);

    // 3. Fix weights if needed
    let gross = data.header.grossWeightKg;
    let net = data.header.netWeightKg;
    if (net > gross && gross > 0) {
      net = gross * 0.95; // Reasonable net
    }

    // 4. Update state
    setData(prev => ({
      ...prev,
      header: {
        ...prev.header,
        deliveryNoteRef: prev.header.deliveryNoteRef || prev.header.asnNumber,
        grossWeightKg: Number(gross.toFixed(3)),
        netWeightKg: Number(net.toFixed(3))
      },
      items: updatedItems,
      girConfig: {
        ...prev.girConfig,
        currentNumber: nextNumber
      }
    }));

    showToast('Naprawiono automatycznie błędy i przeliczono numery GIR');
  };

  // Calculate weights from items
  const calculatedWeightTotal = data.items.reduce((sum, it) => {
    return sum + (it.estimatedWeightKg ? it.estimatedWeightKg * it.packageCount : (it.totalQuantity * 5));
  }, 0);

  const handleAutoCalculateWeights = () => {
    const total = calculatedWeightTotal > 0 ? calculatedWeightTotal : 2300;
    const net = total * 0.95;
    setData(prev => ({
      ...prev,
      header: {
        ...prev.header,
        grossWeightKg: Number(total.toFixed(3)),
        netWeightKg: Number(net.toFixed(3))
      }
    }));
    showToast(`Zaktualizowano wagę brutto (${total.toFixed(1)} kg) i netto (${net.toFixed(1)} kg)`);
  };

  // Reset to brand new empty ASN
  const handleNewASN = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const nowTimeStr = `${todayStr}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    // Parse last ASN number and increment
    const currentAsnNum = parseInt(data.header.asnNumber, 10);
    const nextAsnNum = !isNaN(currentAsnNum) ? String(currentAsnNum + 1).padStart(5, '0') : '00035';

    const firstGirSerial = formatGIRSerial(data.girConfig.currentNumber, data.girConfig.padding);

    setData(prev => ({
      header: {
        ...prev.header,
        asnNumber: nextAsnNum,
        deliveryNoteRef: nextAsnNum,
        documentDate: nowTimeStr,
        despatchDate: nowTimeStr,
        estimatedDeliveryDate: nowTimeStr,
        referenceDate: todayStr,
        grossWeightKg: 1000,
        netWeightKg: 950
      },
      girConfig: {
        ...prev.girConfig,
        currentNumber: prev.girConfig.currentNumber + 1
      },
      items: [
        {
          id: `item-${Date.now()}`,
          cpsSequence: 1,
          packageCount: 10,
          packageType: 'BOX',
          packageTypeQualifier: '92',
          qtyPerPackage: 6,
          totalQuantity: 60,
          unitOfMeasure: 'PCE',
          pciType: '17',
          pciMarks: 'S::10',
          girPrefix: prev.girConfig.prefix,
          girSerial: firstGirSerial,
          partNumber: 'A5906909501',
          partNumberQualifier: 'IN',
          partDescription: 'Część zamienna AMG',
          orderNumber: '49/2026/AMG/DUV',
          estimatedWeightKg: 100
        }
      ]
    }));

    showToast(`Utworzono nowy dokument ASN: ${nextAsnNum}`);
  };

  // Reset to original sample
  const handleLoadSample = () => {
    setData({
      ...DEFAULT_ASN_SAMPLE,
      girConfig: {
        ...DEFAULT_ASN_SAMPLE.girConfig,
        currentNumber: 5010
      }
    });
    showToast('Wczytano oryginalny przykład EDIFACT DESADV (ORSAMOTO / Duvenbeck)');
  };

  // Copy helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Skopiowano treść do schowka!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Download helper
  const handleDownloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Pobrano plik: ${filename}`);
  };

  // Download Consignment Note (Karta Przewozowa) as PDF
  const handleDownloadPDF = () => {
    try {
      generateConsignmentNotePDF(data);
      showToast(`Wygenerowano i pobrano Kartę Przewozową PDF (ASN ${data.header.asnNumber || '00034'})`);
    } catch (err) {
      console.error('Błąd generowania karty przewozowej PDF:', err);
      showToast('Wystąpił błąd podczas generowania karty przewozowej PDF');
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        onNewASN={handleNewASN}
        onLoadSample={handleLoadSample}
        onOpenImport={() => setIsImportModalOpen(true)}
        onExportXML={() => {
          const xml = generateXMLByFormat(data, selectedFormat);
          handleDownloadFile(`ASN_${data.header.asnNumber || 'DESADV'}.xml`, xml, 'application/xml');
        }}
        onExportEDI={() => {
          const edi = generateEDIFACTDESADV(data);
          handleDownloadFile(`DESADV_${data.header.asnNumber || '00034'}.edi`, edi, 'text/plain');
        }}
        onCopyXML={() => {
          const xml = generateXMLByFormat(data, selectedFormat);
          handleCopyText(xml);
        }}
        onDownloadPDF={handleDownloadPDF}
        copied={copied}
        selectedFormat={selectedFormat}
        onSelectFormat={setSelectedFormat}
        hasErrors={hasErrors}
        itemCount={data.items.length}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Validation & Error Correction Banner */}
        <ValidationBanner
          errors={validationErrors}
          onAutoFixAll={handleAutoFixAll}
        />

        {/* Automatic GIR Counter Bar */}
        <GIRCounterManager
          girConfig={data.girConfig}
          onChangeGirConfig={handleGIRConfigChange}
          onApplySequentialGIR={handleApplySequentialGIR}
          items={data.items}
        />

        {/* ASN Header Form (Dates, Weights, Transport, Partners) */}
        <ASNHeaderForm
          header={data.header}
          onChangeHeader={handleHeaderChange}
          onAutoCalculateWeights={handleAutoCalculateWeights}
          calculatedWeightTotal={calculatedWeightTotal}
        />

        {/* ASN Items & Packaging Table (CPS / PAC / LIN / GIR / QTY) */}
        <ASNItemsTable
          items={data.items}
          onChangeItems={handleItemsChange}
          girConfig={data.girConfig}
          onChangeGirConfig={handleGIRConfigChange}
        />

        {/* Generated Output Viewer (XML, EDIFACT & Karta Przewozowa PDF) */}
        <OutputViewer
          data={data}
          selectedFormat={selectedFormat}
          onSelectFormat={setSelectedFormat}
          copied={copied}
          onCopyText={handleCopyText}
          onDownloadFile={handleDownloadFile}
          onDownloadPDF={handleDownloadPDF}
        />
      </main>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(parsedData) => {
          setData(parsedData);
          showToast(`Pomyślnie zaimportowano ASN (${parsedData.items.length} pozycji)`);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ASN XML & EDIFACT DESADV Generator — Obsługa standardów D96A, VDA 4987, UBL 2.1 & ERP XML
          </span>
          <span className="text-slate-400 font-medium">
            Automatyczna walidacja sum, wag i etykiet logistycznych GIR
          </span>
        </div>
      </footer>
    </div>
  );
}
