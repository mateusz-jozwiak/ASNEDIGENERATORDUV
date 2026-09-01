import { ASNData } from '../types/asn';

export const DEFAULT_ASN_SAMPLE: ASNData = {
  header: {
    unbSender: '5900000035314',
    unbRecipient: 'O0177X1JQEDILOG-HOR::2674',
    unbInterchangeRef: '1',
    syntaxIdentifier: 'UNOA:3',
    asnNumber: '00034',
    documentType: '351',
    deliveryNoteRef: '00000034',
    documentDate: '2026-07-27T10:59',
    estimatedDeliveryDate: '2026-07-27T10:59',
    despatchDate: '2026-07-27T10:59',
    referenceDate: '2026-07-27',
    grossWeightKg: 2300.0,
    netWeightKg: 2240.0,
    unloadingPoint: '57U',
    unloadingPointQualifier: '92',
    transportMode: '3',
    carrierCode: '1234567',
    carrierQualifier: '92',
    transportStageQualifier: '12',
    vehiclePlate: 'DW 84920',
    consignor: {
      role: 'CZ',
      code: '15125131',
      codeQualifier: '92',
      name: 'ORSAMOTO',
      city: 'Wrocław',
      countryCode: 'PL'
    },
    seller: {
      role: 'SE',
      code: '15125131',
      codeQualifier: '92',
      name: 'ORSAMOTO',
      city: 'Wrocław',
      countryCode: 'PL'
    },
    buyer: {
      role: 'BY',
      code: '16434037G',
      codeQualifier: '92',
      name: 'Duvenbeck Logistics Europe GmbH',
      city: 'Bocholt',
      countryCode: 'DE'
    },
    consignee: {
      role: 'CN',
      code: 'AD3C',
      codeQualifier: '92',
      name: 'Duvenbeck Logistics Europe GmbH',
      city: 'Bocholt',
      countryCode: 'DE'
    }
  },
  girConfig: {
    prefix: '5900000035314',
    currentNumber: 5038, // Next available after 5006-5020 (item 1: 15), 5021-5035 (item 2: 15), 5036 (item 3: 1), 5037 (item 4: 1)
    padding: 8,
    typeQualifier: '3',
    codeType1: 'UN',
    codeType2: '1J',
    autoIncrementPerLine: true
  },
  items: [
    {
      id: 'item-1',
      cpsSequence: 1,
      packageCount: 15,
      packageType: 'BOX',
      packageTypeQualifier: '92',
      qtyPerPackage: 6,
      totalQuantity: 90,
      unitOfMeasure: 'PCE',
      pciType: '17',
      pciMarks: 'S::10',
      girPrefix: '5900000035314',
      girSerial: '00005006',
      partNumber: 'A5906909501 9J36',
      partNumberQualifier: 'IN',
      partDescription: 'Osłona przednia AMG czarna',
      orderNumber: '49/2026/AMG/DUV',
      estimatedWeightKg: 560
    },
    {
      id: 'item-2',
      cpsSequence: 2,
      packageCount: 15,
      packageType: 'BOX',
      packageTypeQualifier: '92',
      qtyPerPackage: 6,
      totalQuantity: 90,
      unitOfMeasure: 'PCE',
      pciType: '17',
      pciMarks: 'S::10',
      girPrefix: '5900000035314',
      girSerial: '00005021',
      partNumber: 'A5906903102 9J36',
      partNumberQualifier: 'IN',
      partDescription: 'Mocowanie zderzaka AMG',
      orderNumber: '49/2026/AMG/DUV',
      estimatedWeightKg: 560
    },
    {
      id: 'item-3',
      cpsSequence: 3,
      packageCount: 1,
      packageType: 'BOX',
      packageTypeQualifier: '92',
      qtyPerPackage: 6,
      totalQuantity: 6,
      unitOfMeasure: 'PCE',
      pciType: '17',
      pciMarks: 'S::10',
      girPrefix: '5900000035314',
      girSerial: '00005036',
      partNumber: 'A5906909501 8AM6 LH',
      partNumberQualifier: 'IN',
      partDescription: 'Reflektor lewy LH',
      orderNumber: '49/2026/AMG/DUV',
      estimatedWeightKg: 37.3
    },
    {
      id: 'item-4',
      cpsSequence: 4,
      packageCount: 1,
      packageType: 'BOX',
      packageTypeQualifier: '92',
      qtyPerPackage: 6,
      totalQuantity: 6,
      unitOfMeasure: 'PCE',
      pciType: '17',
      pciMarks: 'S::10',
      girPrefix: '5900000035314',
      girSerial: '00005037',
      partNumber: 'A5906903102 8AM6 RH',
      partNumberQualifier: 'IN',
      partDescription: 'Reflektor prawy RH',
      orderNumber: '49/2026/AMG/DUV',
      estimatedWeightKg: 37.3
    }
  ]
};

export const RAW_SAMPLE_EDIFACT = `UNA:+.? '
UNB+UNOA:3+5900000035314+O0177X1JQEDILOG-HOR::2674+260827:1049+1++DESADV'
UNH+1+DESADV:D:96A:UN'
BGM+351+00034'
DTM+137:202607271059:203'
DTM+132:202607271059:203'
DTM+11:202607271059:203'
MEA+AAX+G+KGM:2300.000'
MEA+AAX+N+KGM:2240.000'
RFF+DQ:00000034'
DTM+171:20260727:102'
NAD+CZ+15125131::92++ORSAMOTO'
NAD+SE+15125131::92++ORSAMOTO'
NAD+BY+16434037G::92++Duvenbeck Logistics Europe GmbH'
NAD+CN+AD3C::92++Duvenbeck Logistics Europe GmbH'
LOC+11+57U::92'
TDT+12++3++1234567::92'
CPS+1++1'
PAC+15++BOX::92'
QTY+52:6:PCE'
PCI+17+++S::10'
GIR+3+5900000035314+00005006+UN+1J'
GIR+3+5900000035314+00005007+UN+1J'
GIR+3+5900000035314+00005008+UN+1J'
GIR+3+5900000035314+00005009+UN+1J'
GIR+3+5900000035314+00005010+UN+1J'
GIR+3+5900000035314+00005011+UN+1J'
GIR+3+5900000035314+00005012+UN+1J'
GIR+3+5900000035314+00005013+UN+1J'
GIR+3+5900000035314+00005014+UN+1J'
GIR+3+5900000035314+00005015+UN+1J'
GIR+3+5900000035314+00005016+UN+1J'
GIR+3+5900000035314+00005017+UN+1J'
GIR+3+5900000035314+00005018+UN+1J'
GIR+3+5900000035314+00005019+UN+1J'
GIR+3+5900000035314+00005020+UN+1J'
LIN+++A5906909501 9J36:IN'
QTY+12:90:PCE'
RFF+ON:49/2026/AMG/DUV'
CPS+2++1'
PAC+15++BOX::92'
QTY+52:6:PCE'
PCI+17+++S::10'
GIR+3+5900000035314+00005021+UN+1J'
GIR+3+5900000035314+00005022+UN+1J'
GIR+3+5900000035314+00005023+UN+1J'
GIR+3+5900000035314+00005024+UN+1J'
GIR+3+5900000035314+00005025+UN+1J'
GIR+3+5900000035314+00005026+UN+1J'
GIR+3+5900000035314+00005027+UN+1J'
GIR+3+5900000035314+00005028+UN+1J'
GIR+3+5900000035314+00005029+UN+1J'
GIR+3+5900000035314+00005030+UN+1J'
GIR+3+5900000035314+00005031+UN+1J'
GIR+3+5900000035314+00005032+UN+1J'
GIR+3+5900000035314+00005033+UN+1J'
GIR+3+5900000035314+00005034+UN+1J'
GIR+3+5900000035314+00005035+UN+1J'
LIN+++A5906903102 9J36:IN'
QTY+12:90:PCE'
RFF+ON:49/2026/AMG/DUV'
CPS+3++1'
PAC+1++BOX::92'
QTY+52:6:PCE'
PCI+17+++S::10'
GIR+3+5900000035314+00005036+UN+1J'
LIN+++A5906909501 8AM6 LH:IN'
QTY+12:6:PCE'
RFF+ON:49/2026/AMG/DUV'
CPS+4++1'
PAC+1++BOX::92'
QTY+52:6:PCE'
PCI+17+++S::10'
GIR+3+5900000035314+00005037+UN+1J'
LIN+++A5906903102 8AM6 RH:IN'
QTY+12:6:PCE'
RFF+ON:49/2026/AMG/DUV'
UNT+76+1'
UNZ+1+1'`;
