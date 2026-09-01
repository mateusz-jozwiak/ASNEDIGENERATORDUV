import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Calculator, 
  Layers, 
  Hash, 
  Check, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Boxes,
  Eye,
  EyeOff
} from 'lucide-react';
import { ASNItemLine, GIRConfig } from '../types/asn';
import { formatGIRSerial, getGIRRangeText } from '../utils/girCounter';

interface ASNItemsTableProps {
  items: ASNItemLine[];
  onChangeItems: (items: ASNItemLine[]) => void;
  girConfig: GIRConfig;
  onChangeGirConfig: (config: GIRConfig) => void;
}

const COMMON_PACKAGE_TYPES = ['BOX', 'PALLET', 'KLT', 'CTN', 'TRAY', 'DRUM', 'BAG', 'CRATE'];
const COMMON_UNITS = ['PCE', 'KGM', 'MTR', 'LTR', 'SET', 'PRS'];

export const ASNItemsTable: React.FC<ASNItemsTableProps> = ({
  items,
  onChangeItems,
  girConfig,
  onChangeGirConfig
}) => {
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [showAdvancedColumns, setShowAdvancedColumns] = useState(false);

  // Add new row with auto next CPS and auto next GIR
  const handleAddRow = () => {
    const nextSeq = items.length + 1;
    const nextGirNum = girConfig.currentNumber;
    const nextGirSerial = formatGIRSerial(nextGirNum, girConfig.padding);

    const newItem: ASNItemLine = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      cpsSequence: nextSeq,
      packageCount: 1,
      packageType: items[items.length - 1]?.packageType || 'BOX',
      packageTypeQualifier: '92',
      qtyPerPackage: items[items.length - 1]?.qtyPerPackage || 6,
      totalQuantity: (items[items.length - 1]?.qtyPerPackage || 6) * 1,
      unitOfMeasure: items[items.length - 1]?.unitOfMeasure || 'PCE',
      pciType: '17',
      pciMarks: 'S::10',
      girPrefix: girConfig.prefix,
      girSerial: nextGirSerial,
      partNumber: '',
      partNumberQualifier: 'IN',
      orderNumber: items[items.length - 1]?.orderNumber || '',
      estimatedWeightKg: 10
    };

    onChangeItems([...items, newItem]);
    onChangeGirConfig({
      ...girConfig,
      currentNumber: nextGirNum + 1
    });
  };

  // Duplicate specific row
  const handleDuplicateRow = (index: number) => {
    const source = items[index];
    const nextGirNum = girConfig.currentNumber;
    const nextGirSerial = formatGIRSerial(nextGirNum, girConfig.padding);

    const duplicated: ASNItemLine = {
      ...source,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      cpsSequence: items.length + 1,
      girSerial: nextGirSerial
    };

    const updated = [...items];
    updated.splice(index + 1, 0, duplicated);

    // Renumber CPS sequence
    const renumbered = updated.map((it, idx) => ({ ...it, cpsSequence: idx + 1 }));
    onChangeItems(renumbered);
    onChangeGirConfig({
      ...girConfig,
      currentNumber: nextGirNum + (source.packageCount || 1)
    });
  };

  // Remove row
  const handleDeleteRow = (index: number) => {
    if (items.length <= 1) {
      alert('Dokument ASN musi zawierać co najmniej jedną pozycję.');
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    const renumbered = updated.map((it, idx) => ({ ...it, cpsSequence: idx + 1 }));
    onChangeItems(renumbered);
  };

  // Move row up/down
  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);

    const renumbered = updated.map((it, idx) => ({ ...it, cpsSequence: idx + 1 }));
    onChangeItems(renumbered);
  };

  // Update field for specific row
  const handleRowChange = (index: number, field: keyof ASNItemLine, value: any) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };

    // Auto-calculate total quantity when package count or qtyPerPackage changes
    if (field === 'packageCount' || field === 'qtyPerPackage') {
      const count = field === 'packageCount' ? Number(value) || 0 : row.packageCount;
      const perPack = field === 'qtyPerPackage' ? Number(value) || 0 : row.qtyPerPackage;
      row.totalQuantity = count * perPack;
    }

    updated[index] = row;
    onChangeItems(updated);
  };

  // Copy Order Number (RFF+ON) from a specific row to all rows
  const handleCopyOrderToAll = (orderNumber: string) => {
    if (!orderNumber) return;
    const updated = items.map(it => ({ ...it, orderNumber }));
    onChangeItems(updated);
    setCopiedOrderId(orderNumber);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Bulk recalculate all totals (packageCount * qtyPerPackage)
  const handleRecalculateAllTotals = () => {
    const updated = items.map(it => ({
      ...it,
      totalQuantity: (it.packageCount || 0) * (it.qtyPerPackage || 0)
    }));
    onChangeItems(updated);
  };

  // Totals calculations
  const totalPackages = items.reduce((acc, it) => acc + (Number(it.packageCount) || 0), 0);
  const totalQuantity = items.reduce((acc, it) => acc + (Number(it.totalQuantity) || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Table Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Pozycje i Opakowania (CPS / LIN / GIR)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              {items.length} {items.length === 1 ? 'pozycja' : 'pozycje'} ({totalPackages} kartonów)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Wprowadź kod części i ilość opakowań. Licznik GIR automatycznie przydziela unikalne etykiety dla każdego kartonu.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvancedColumns(!showAdvancedColumns)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
            title="Pokaż/Ukryj stałe kolumny typu opakowania i jednostki"
          >
            {showAdvancedColumns ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
            <span>{showAdvancedColumns ? 'Ukryj stałe kolumny' : 'Pokaż stałe kolumny (BOX/PCE)'}</span>
          </button>

          <button
            type="button"
            onClick={handleRecalculateAllTotals}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
            title="Przelicz ponownie Ilości Całkowite (QTY 12 = PAC × QTY 52) dla wszystkich wierszy"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Przelicz ilości</span>
          </button>

          <button
            type="button"
            id="btn-add-item-line"
            onClick={handleAddRow}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dodaj pozycję</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <th className="py-2.5 px-3 w-12 text-center">CPS</th>
              <th className="py-2.5 px-3 min-w-[220px]">Numer Artykułu / Kod części (LIN)</th>
              <th className="py-2.5 px-2 w-24 text-center">Opakowań (PAC)</th>
              {showAdvancedColumns && (
                <th className="py-2.5 px-2 w-24">Typ Opak.</th>
              )}
              <th className="py-2.5 px-2 w-24 text-center">Szt./Opak. (QTY 52)</th>
              <th className="py-2.5 px-2 w-28 text-center bg-blue-50/50 text-blue-800">
                Ilość Łączna (QTY 12)
              </th>
              {showAdvancedColumns && (
                <th className="py-2.5 px-2 w-18">Jedn.</th>
              )}
              <th className="py-2.5 px-3 min-w-[180px]">Numer Zlecenia (RFF+ON)</th>
              <th className="py-2.5 px-3 min-w-[220px]">
                <span className="flex items-center gap-1 text-slate-600 font-bold">
                  <Hash className="w-3 h-3 text-blue-600" /> Etykiety GIR (Handling Units)
                </span>
              </th>
              <th className="py-2.5 px-2 w-24 text-center">Akcje</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-800">
            {items.map((item, index) => {
              const expectedTotal = (item.packageCount || 0) * (item.qtyPerPackage || 0);
              const isTotalSynced = item.totalQuantity === expectedTotal;
              const rangeText = getGIRRangeText(item);

              return (
                <tr 
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* CPS Sequence */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 bg-slate-50/30">
                    {item.cpsSequence}
                  </td>

                  {/* Part Number (LIN) */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={item.partNumber}
                        onChange={(e) => handleRowChange(index, 'partNumber', e.target.value)}
                        placeholder="np. A5906909501 9J36"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={item.partDescription || ''}
                        onChange={(e) => handleRowChange(index, 'partDescription', e.target.value)}
                        placeholder="Opis artykułu (opcjonalny)"
                        className="w-full bg-transparent border-0 text-[11px] text-slate-400 px-1 py-0 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </td>

                  {/* Package Count (PAC) */}
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      min="1"
                      value={item.packageCount}
                      onChange={(e) => handleRowChange(index, 'packageCount', parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-slate-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </td>

                  {/* Package Type (Advanced) */}
                  {showAdvancedColumns && (
                    <td className="py-3 px-2">
                      <select
                        value={item.packageType}
                        onChange={(e) => handleRowChange(index, 'packageType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 font-mono text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      >
                        {COMMON_PACKAGE_TYPES.map(pkg => (
                          <option key={pkg} value={pkg}>{pkg}</option>
                        ))}
                      </select>
                    </td>
                  )}

                  {/* Qty Per Package (QTY 52) */}
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      min="1"
                      value={item.qtyPerPackage}
                      onChange={(e) => handleRowChange(index, 'qtyPerPackage', parseFloat(e.target.value) || 1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center font-mono text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </td>

                  {/* Total Quantity (QTY 12) */}
                  <td className="py-3 px-2 bg-blue-50/30">
                    <input
                      type="number"
                      min="1"
                      value={item.totalQuantity}
                      onChange={(e) => handleRowChange(index, 'totalQuantity', parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-lg px-2 py-1.5 text-center font-mono font-bold text-xs focus:bg-white focus:outline-none ${
                        isTotalSynced 
                          ? 'bg-blue-50/80 border-blue-200 text-blue-900 focus:border-blue-500' 
                          : 'bg-amber-50 border-amber-300 text-amber-900 focus:border-amber-500'
                      }`}
                      title={!isTotalSynced ? `Uwaga: Wyliczona ilość to ${expectedTotal}` : 'Ilość zgodna (Opakowania × Szt/opak)'}
                    />
                  </td>

                  {/* Unit of Measure (Advanced) */}
                  {showAdvancedColumns && (
                    <td className="py-3 px-2">
                      <select
                        value={item.unitOfMeasure}
                        onChange={(e) => handleRowChange(index, 'unitOfMeasure', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5 font-mono text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      >
                        {COMMON_UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>
                  )}

                  {/* Purchase Order Number (RFF+ON) */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={item.orderNumber}
                        onChange={(e) => handleRowChange(index, 'orderNumber', e.target.value)}
                        placeholder="np. 49/2026/AMG/DUV"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                      {item.orderNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopyOrderToAll(item.orderNumber)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                          title="Kopiuj ten numer zlecenia do wszystkich pozycji"
                        >
                          {copiedOrderId === item.orderNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* GIR Serial Number & Computed Range */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="text"
                          value={item.girSerial}
                          onChange={(e) => handleRowChange(index, 'girSerial', e.target.value)}
                          className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-blue-700 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                          placeholder="00005006"
                        />
                      </div>
                      <div className="text-[11px] font-mono text-blue-700 bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded-md inline-block">
                        {rangeText}
                      </div>
                    </div>
                  </td>

                  {/* Row Actions */}
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveRow(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors cursor-pointer"
                        title="Przesuń w górę"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveRow(index, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors cursor-pointer"
                        title="Przesuń w dół"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateRow(index)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Klonuj pozycję (auto-kolejny GIR)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Usuń pozycję"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Totals Summary Footer */}
          <tfoot>
            <tr className="bg-slate-50 font-semibold text-slate-800 border-t-2 border-slate-200">
              <td colSpan={2} className="py-3 px-3 text-right text-xs uppercase tracking-wider text-slate-500 font-bold">
                SUMA CAŁKOWITA:
              </td>
              <td className="py-3 px-2 text-center font-mono font-bold text-blue-700">
                {totalPackages}
              </td>
              {showAdvancedColumns && (
                <td className="py-3 px-2 text-slate-500 font-normal">kartonów</td>
              )}
              <td className="py-3 px-2"></td>
              <td className="py-3 px-2 text-center font-mono font-bold text-blue-700 bg-blue-50/50">
                {totalQuantity}
              </td>
              {showAdvancedColumns && (
                <td className="py-3 px-2 text-slate-500 font-normal">szt. (PCE)</td>
              )}
              <td colSpan={showAdvancedColumns ? 3 : 2} className="py-3 px-3 text-right text-slate-500 text-xs font-normal">
                Łącznie pozycji CPS: <span className="font-semibold text-slate-800">{items.length}</span> (kartonów: <span className="font-bold text-blue-700">{totalPackages}</span>)
              </td>
              <td className="py-3 px-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
