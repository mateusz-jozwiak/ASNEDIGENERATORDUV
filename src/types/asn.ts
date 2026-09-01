export interface PartnerNAD {
  role: 'CZ' | 'SE' | 'BY' | 'CN' | 'FW' | 'CA' | string; // CZ=Consignor (Nadawca), SE=Seller, BY=Buyer, CN=Consignee (Odbiorca)
  code: string;
  codeQualifier?: string; // e.g. 92 (Assigned by buyer or seller)
  name: string;
  street?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface GIRConfig {
  prefix: string; // e.g. "5900000035314" (GS1 / Supplier code)
  currentNumber: number; // e.g. 5006
  padding: number; // e.g. 8 (producing 00005006)
  typeQualifier: string; // e.g. "3" (Identification)
  codeType1: string; // e.g. "UN"
  codeType2: string; // e.g. "1J" (AIAG / Odette / VDA standard container ID)
  autoIncrementPerLine: boolean;
}

export interface ASNItemLine {
  id: string;
  cpsSequence: number; // CPS+1, CPS+2...
  packageCount: number; // PAC package count, e.g. 15
  packageType: string; // e.g. "BOX", "PALLET", "KLT", "CTN"
  packageTypeQualifier: string; // e.g. "92"
  qtyPerPackage: number; // QTY+52, e.g. 6 PCE
  totalQuantity: number; // QTY+12, e.g. 90 PCE (auto-calculated: packageCount * qtyPerPackage)
  unitOfMeasure: string; // e.g. "PCE", "KGM"
  pciType: string; // e.g. "17"
  pciMarks: string; // e.g. "S::10"
  girPrefix: string; // e.g. "5900000035314"
  girSerial: string; // e.g. "00005006"
  partNumber: string; // LIN item code, e.g. "A5906909501 9J36"
  partNumberQualifier: string; // e.g. "IN" (Buyer's part number)
  partDescription?: string;
  orderNumber: string; // RFF+ON, e.g. "49/2026/AMG/DUV"
  estimatedWeightKg?: number;
}

export interface ASNHeader {
  unbSender: string; // e.g. "5900000035314"
  unbRecipient: string; // e.g. "O0177X1JQEDILOG-HOR::2674"
  unbInterchangeRef: string; // e.g. "1"
  syntaxIdentifier: string; // e.g. "UNOA:3"
  
  asnNumber: string; // BGM+351+00034
  documentType: string; // 351 = Despatch advice
  deliveryNoteRef: string; // RFF+DQ:00000034
  
  documentDate: string; // YYYY-MM-DDTHH:mm (DTM+137)
  estimatedDeliveryDate: string; // YYYY-MM-DDTHH:mm (DTM+132)
  despatchDate: string; // YYYY-MM-DDTHH:mm (DTM+11)
  referenceDate: string; // YYYY-MM-DD (DTM+171)
  
  grossWeightKg: number; // MEA+AAX+G+KGM:2300.000
  netWeightKg: number; // MEA+AAX+N+KGM:2240.000
  
  unloadingPoint: string; // LOC+11+57U::92 (e.g. 57U)
  unloadingPointQualifier: string; // 92
  
  transportMode: string; // TDT: 3 = Road transport
  carrierCode: string; // TDT: e.g. "1234567"
  carrierQualifier: string; // 92
  transportStageQualifier: string; // 12
  vehiclePlate?: string;
  
  consignor: PartnerNAD; // NAD+CZ (Nadawca)
  seller: PartnerNAD; // NAD+SE (Sprzedawca)
  buyer: PartnerNAD; // NAD+BY (Kupujący)
  consignee: PartnerNAD; // NAD+CN (Odbiorca)
}

export interface ASNData {
  header: ASNHeader;
  items: ASNItemLine[];
  girConfig: GIRConfig;
}

export type XMLFormatType = 'standard-xml' | 'automotive-vda' | 'erp-canonical' | 'edifact-json';

export interface ValidationError {
  id: string;
  field: string;
  message: string;
  type: 'error' | 'warning';
  fixAction?: () => void;
  fixLabel?: string;
}
