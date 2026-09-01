import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Scale, 
  Truck, 
  Building2, 
  Link2, 
  Sparkles, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  HelpCircle,
  Copy,
  Users,
  Settings,
  CheckCircle2
} from 'lucide-react';
import { ASNHeader, PartnerNAD } from '../types/asn';

interface ASNHeaderFormProps {
  header: ASNHeader;
  onChangeHeader: (header: ASNHeader) => void;
  onAutoCalculateWeights: () => void;
  calculatedWeightTotal: number;
}

export const ASNHeaderForm: React.FC<ASNHeaderFormProps> = ({
  header,
  onChangeHeader,
  onAutoCalculateWeights,
  calculatedWeightTotal
}) => {
  const [syncDeliveryNote, setSyncDeliveryNote] = useState(true);
  const [showConstantData, setShowConstantData] = useState(false);

  const handleFieldChange = <K extends keyof ASNHeader>(field: K, value: ASNHeader[K]) => {
    const updated = { ...header, [field]: value };
    
    // Auto sync delivery note if enabled
    if (field === 'asnNumber' && syncDeliveryNote) {
      updated.deliveryNoteRef = String(value);
    }
    
    onChangeHeader(updated);
  };

  const handlePartnerChange = (partnerKey: 'consignor' | 'seller' | 'buyer' | 'consignee', field: keyof PartnerNAD, value: string) => {
    onChangeHeader({
      ...header,
      [partnerKey]: {
        ...header[partnerKey],
        [field]: value
      }
    });
  };

  // Quick Date Helpers - automatically sync all DTMs (137, 132, 11, 171)
  const setDatesToNow = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const nowTimeStr = `${todayStr}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    // Estimated delivery + 4 hours
    const delDate = new Date(now.getTime() + 4 * 3600 * 1000);
    const delTimeStr = `${delDate.getFullYear()}-${pad(delDate.getMonth() + 1)}-${pad(delDate.getDate())}T${pad(delDate.getHours())}:${pad(delDate.getMinutes())}`;

    onChangeHeader({
      ...header,
      documentDate: nowTimeStr,
      despatchDate: nowTimeStr,
      estimatedDeliveryDate: delTimeStr,
      referenceDate: todayStr
    });
  };

  const setDatesTomorrow = () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
    const tomorrowTimeStr = `${tomorrowStr}T08:00`;
    const arrivalTimeStr = `${tomorrowStr}T14:00`;

    onChangeHeader({
      ...header,
      documentDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
      despatchDate: tomorrowTimeStr,
      estimatedDeliveryDate: arrivalTimeStr,
      referenceDate: tomorrowStr
    });
  };

  // Synchronize main date across all DTM segments
  const handlePrimaryDateChange = (val: string) => {
    const cleanDateOnly = val.slice(0, 10);
    onChangeHeader({
      ...header,
      despatchDate: val,
      documentDate: val,
      estimatedDeliveryDate: val,
      referenceDate: cleanDateOnly
    });
  };

  return (
    <div className="space-y-4">
      {/* Top 2 Primary Bento Tiles for Daily Dynamic Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. Shipment Core Variables (BGM / WZ / DTM) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Dane Awizacji i Terminy</span>
              </h2>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={setDatesToNow}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200/60 cursor-pointer"
                >
                  Teraz
                </button>
                <button
                  type="button"
                  onClick={setDatesTomorrow}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
                >
                  Jutro 08:00
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* ASN Number & Delivery Note */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numer Awizacji (BGM+351)
                  </label>
                  <input
                    id="input-asn-number"
                    type="text"
                    value={header.asnNumber}
                    onChange={(e) => handleFieldChange('asnNumber', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    placeholder="00034"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 truncate">
                      Nr WZ (RFF+DQ)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSyncDeliveryNote(!syncDeliveryNote);
                        if (!syncDeliveryNote) handleFieldChange('deliveryNoteRef', header.asnNumber);
                      }}
                      className={`text-[11px] flex items-center gap-1 font-semibold cursor-pointer ${
                        syncDeliveryNote ? 'text-blue-600' : 'text-slate-400'
                      }`}
                      title="Automatycznie ustawiaj WZ taki sam jak ASN"
                    >
                      <Link2 className="w-3 h-3" /> Sync
                    </button>
                  </div>
                  <input
                    id="input-delivery-note-ref"
                    type="text"
                    value={header.deliveryNoteRef}
                    onChange={(e) => handleFieldChange('deliveryNoteRef', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    placeholder="00000034"
                  />
                </div>
              </div>

              {/* Main Despatch Date with auto-sync */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data i godzina wysyłki / dostawy (DTM)
                </label>
                <input
                  id="input-despatch-date"
                  type="datetime-local"
                  value={header.despatchDate}
                  onChange={(e) => handlePrimaryDateChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Automatycznie synchronizuje segmenty DTM 137 (dokument), 132 (dostawa), 11 (wysyłka) i 171 (data WZ).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Transport Weights (MEA) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                <span>Wagi ładunku (MEA)</span>
              </h2>
              {calculatedWeightTotal > 0 && (
                <button
                  type="button"
                  onClick={onAutoCalculateWeights}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-200 flex items-center gap-1 cursor-pointer"
                  title="Wstaw wagę z sumy pozycji towarowych"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" /> Pozycje: {calculatedWeightTotal.toFixed(1)} kg
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Masa Brutto (kg)
                  </label>
                  <input
                    id="input-gross-weight"
                    type="number"
                    step="0.001"
                    value={header.grossWeightKg}
                    onChange={(e) => handleFieldChange('grossWeightKg', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    placeholder="2300.000"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">MEA+AAX+G+KGM</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Masa Netto (kg)
                  </label>
                  <input
                    id="input-net-weight"
                    type="number"
                    step="0.001"
                    value={header.netWeightKg}
                    onChange={(e) => handleFieldChange('netWeightKg', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    placeholder="2240.000"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">MEA+AAX+N+KGM</span>
                </div>
              </div>

              {/* Vehicle plate & quick summary */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Numer Rejestracyjny Pojazdu (opcjonalny)
                </label>
                <input
                  id="input-vehicle-plate"
                  type="text"
                  value={header.vehiclePlate || ''}
                  onChange={(e) => handleFieldChange('vehiclePlate', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  placeholder="np. DW 84920"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Collapsible Partner & Logistics Constants Panel (NAD / UNB / LOC / TDT) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div 
          onClick={() => setShowConstantData(!showConstantData)}
          className="p-3.5 sm:p-4 bg-slate-50/70 hover:bg-slate-100/70 transition-colors flex items-center justify-between cursor-pointer border-b border-slate-200/60"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-200/70 text-slate-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Stałe dane partnerów i nagłówka (NAD / UNB / LOC / TDT)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                  Skonfigurowane domyślnie
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-2xl">
                {header.consignor?.name} ({header.consignor?.code}) ➔ {header.consignee?.name} ({header.consignee?.code}) | Brama: {header.unloadingPoint} | Przewoźnik: {header.carrierCode}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>{showConstantData ? 'Ukryj stałe dane' : 'Pokaż / Edytuj stałe dane'}</span>
            {showConstantData ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Form for Constants */}
        {showConstantData && (
          <div className="p-4 sm:p-6 space-y-4 bg-white animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Consignor CZ */}
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Nadawca (NAD+CZ)
                </label>
                <input
                  type="text"
                  value={header.consignor.code}
                  onChange={(e) => handlePartnerChange('consignor', 'code', e.target.value)}
                  placeholder="Kod (np. 15125131)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800"
                />
                <input
                  type="text"
                  value={header.consignor.name}
                  onChange={(e) => handlePartnerChange('consignor', 'name', e.target.value)}
                  placeholder="Nazwa (ORSAMOTO)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
                />
              </div>

              {/* Seller SE */}
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Sprzedawca (NAD+SE)
                </label>
                <input
                  type="text"
                  value={header.seller.code}
                  onChange={(e) => handlePartnerChange('seller', 'code', e.target.value)}
                  placeholder="Kod (np. 15125131)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800"
                />
                <input
                  type="text"
                  value={header.seller.name}
                  onChange={(e) => handlePartnerChange('seller', 'name', e.target.value)}
                  placeholder="Nazwa (ORSAMOTO)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
                />
              </div>

              {/* Buyer BY */}
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Kupujący (NAD+BY)
                </label>
                <input
                  type="text"
                  value={header.buyer.code}
                  onChange={(e) => handlePartnerChange('buyer', 'code', e.target.value)}
                  placeholder="Kod (np. 16434037G)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800"
                />
                <input
                  type="text"
                  value={header.buyer.name}
                  onChange={(e) => handlePartnerChange('buyer', 'name', e.target.value)}
                  placeholder="Nazwa (Duvenbeck Logistics)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
                />
              </div>

              {/* Consignee CN */}
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Odbiorca (NAD+CN)
                </label>
                <input
                  type="text"
                  value={header.consignee.code}
                  onChange={(e) => handlePartnerChange('consignee', 'code', e.target.value)}
                  placeholder="Kod (np. AD3C)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800"
                />
                <input
                  type="text"
                  value={header.consignee.name}
                  onChange={(e) => handlePartnerChange('consignee', 'name', e.target.value)}
                  placeholder="Nazwa (Duvenbeck Logistics)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
                />
              </div>
            </div>

            {/* Logistics & Routing Routing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Brama rozładunku (LOC+11)
                </label>
                <input
                  type="text"
                  value={header.unloadingPoint}
                  onChange={(e) => handleFieldChange('unloadingPoint', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                  placeholder="57U"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kod Przewoźnika (TDT)
                </label>
                <input
                  type="text"
                  value={header.carrierCode}
                  onChange={(e) => handleFieldChange('carrierCode', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                  placeholder="1234567"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  UNB Nadawca (Sender ID)
                </label>
                <input
                  type="text"
                  value={header.unbSender}
                  onChange={(e) => handleFieldChange('unbSender', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none"
                  placeholder="5900000035314"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
