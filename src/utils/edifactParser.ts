import { ASNData, ASNHeader, ASNItemLine, PartnerNAD } from '../types/asn';
import { DEFAULT_ASN_SAMPLE } from './sampleData';

/**
 * Parses raw EDIFACT DESADV D96A/D97A text into structured ASNData.
 */
export function parseEDIFACTDESADV(rawEdifact: string): { data: ASNData; warnings: string[] } {
  const warnings: string[] = [];
  const cleanText = rawEdifact.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Segments are usually terminated by ' (apostrophe)
  const segmentStrings = cleanText
    .split("'")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (segmentStrings.length === 0) {
    throw new Error('Plik jest pusty lub nie zawiera poprawnych segmentów EDIFACT (brak separatora \').');
  }

  // Clone default structure to fill in
  const header: ASNHeader = { ...DEFAULT_ASN_SAMPLE.header };
  const items: ASNItemLine[] = [];
  
  let currentItem: Partial<ASNItemLine> | null = null;
  let highestGirNumber = 5000;
  let detectedGirPrefix = '5900000035314';
  let detectedPadding = 8;

  const parseDateTimeEDI = (rawStr: string, formatCode: string): string => {
    // Format 203 = CCYYMMDDHHMM (e.g. 202607271059)
    if (formatCode === '203' && rawStr.length >= 12) {
      const y = rawStr.slice(0, 4);
      const m = rawStr.slice(4, 6);
      const d = rawStr.slice(6, 8);
      const hh = rawStr.slice(8, 10);
      const mm = rawStr.slice(10, 12);
      return `${y}-${m}-${d}T${hh}:${mm}`;
    }
    // Format 102 = CCYYMMDD (e.g. 20260727)
    if (formatCode === '102' && rawStr.length >= 8) {
      const y = rawStr.slice(0, 4);
      const m = rawStr.slice(4, 6);
      const d = rawStr.slice(6, 8);
      return `${y}-${m}-${d}`;
    }
    return rawStr;
  };

  for (const segStr of segmentStrings) {
    if (segStr.startsWith('UNA')) {
      // UNA defines delimiter characters (UNA:+.? ')
      continue;
    }
    const parts = segStr.split('+');
    const tag = parts[0]?.trim();

    if (!tag) continue;

    switch (tag) {
      case 'UNB': {
        // UNB+UNOA:3+5900000035314+O0177X1JQEDILOG-HOR::2674+260827:1049+1++DESADV
        header.syntaxIdentifier = parts[1] || 'UNOA:3';
        header.unbSender = parts[2] || '';
        header.unbRecipient = parts[3] || '';
        header.unbInterchangeRef = parts[5] || '1';
        break;
      }
      case 'BGM': {
        // BGM+351+00034
        header.documentType = parts[1] || '351';
        header.asnNumber = parts[2] || '';
        break;
      }
      case 'DTM': {
        // DTM+137:202607271059:203
        const dtmParts = (parts[1] || '').split(':');
        const dtmQualifier = dtmParts[0];
        const dtmVal = dtmParts[1] || '';
        const dtmFmt = dtmParts[2] || '203';

        if (dtmQualifier === '137') {
          header.documentDate = parseDateTimeEDI(dtmVal, dtmFmt);
        } else if (dtmQualifier === '132') {
          header.estimatedDeliveryDate = parseDateTimeEDI(dtmVal, dtmFmt);
        } else if (dtmQualifier === '11') {
          header.despatchDate = parseDateTimeEDI(dtmVal, dtmFmt);
        } else if (dtmQualifier === '171') {
          header.referenceDate = parseDateTimeEDI(dtmVal, dtmFmt);
        }
        break;
      }
      case 'MEA': {
        // MEA+AAX+G+KGM:2300.000 or MEA+AAX+N+KGM:2240.000
        const weightType = parts[2]; // G=Gross, N=Net
        const weightComp = (parts[3] || '').split(':');
        const val = parseFloat(weightComp[1] || '0');
        if (weightType === 'G') {
          header.grossWeightKg = val;
        } else if (weightType === 'N') {
          header.netWeightKg = val;
        }
        break;
      }
      case 'RFF': {
        // RFF+DQ:00000034 (Header level) or RFF+ON:49/2026/AMG/DUV (Item level)
        const rffComp = (parts[1] || '').split(':');
        const rffQual = rffComp[0];
        const rffVal = rffComp[1] || '';

        if (rffQual === 'DQ') {
          header.deliveryNoteRef = rffVal;
        } else if (rffQual === 'ON') {
          if (currentItem) {
            currentItem.orderNumber = rffVal;
          }
        }
        break;
      }
      case 'NAD': {
        // NAD+CZ+15125131::92++ORSAMOTO
        const role = parts[1];
        const codeComp = (parts[2] || '').split(':');
        const code = codeComp[0] || '';
        const qualifier = codeComp[2] || '92';
        const name = parts[4] || '';

        const partner: PartnerNAD = {
          role,
          code,
          codeQualifier: qualifier,
          name: name.replace(/\+/g, ' ').trim()
        };

        if (role === 'CZ') header.consignor = partner;
        else if (role === 'SE') header.seller = partner;
        else if (role === 'BY') header.buyer = partner;
        else if (role === 'CN') header.consignee = partner;
        break;
      }
      case 'LOC': {
        // LOC+11+57U::92
        const locComp = (parts[2] || '').split(':');
        header.unloadingPoint = locComp[0] || '';
        header.unloadingPointQualifier = locComp[2] || '92';
        break;
      }
      case 'TDT': {
        // TDT+12++3++1234567::92
        header.transportStageQualifier = parts[1] || '12';
        header.transportMode = parts[3] || '3';
        const carrierComp = (parts[5] || '').split(':');
        header.carrierCode = carrierComp[0] || '';
        header.carrierQualifier = carrierComp[2] || '92';
        break;
      }
      case 'CPS': {
        // CPS+1++1 (Begin new packing hierarchy)
        if (currentItem && currentItem.partNumber) {
          items.push(currentItem as ASNItemLine);
        }
        const cpsSeq = parseInt(parts[1] || '1', 10) || (items.length + 1);
        currentItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          cpsSequence: cpsSeq,
          packageCount: 1,
          packageType: 'BOX',
          packageTypeQualifier: '92',
          qtyPerPackage: 1,
          totalQuantity: 1,
          unitOfMeasure: 'PCE',
          pciType: '17',
          pciMarks: 'S::10',
          girPrefix: header.unbSender || '5900000035314',
          girSerial: '',
          partNumber: '',
          partNumberQualifier: 'IN',
          orderNumber: ''
        };
        break;
      }
      case 'PAC': {
        // PAC+15++BOX::92
        if (currentItem) {
          currentItem.packageCount = parseInt(parts[1] || '1', 10) || 1;
          const pacComp = (parts[3] || '').split(':');
          currentItem.packageType = pacComp[0] || 'BOX';
          currentItem.packageTypeQualifier = pacComp[2] || '92';
        }
        break;
      }
      case 'QTY': {
        // QTY+52:6:PCE (Package QTY) or QTY+12:90:PCE (Despatch QTY)
        const qtyComp = (parts[1] || '').split(':');
        const qtyQual = qtyComp[0];
        const qtyVal = parseFloat(qtyComp[1] || '0');
        const uom = qtyComp[2] || 'PCE';

        if (currentItem) {
          currentItem.unitOfMeasure = uom;
          if (qtyQual === '52') {
            currentItem.qtyPerPackage = qtyVal;
          } else if (qtyQual === '12') {
            currentItem.totalQuantity = qtyVal;
          }
        }
        break;
      }
      case 'PCI': {
        // PCI+17+++S::10
        if (currentItem) {
          currentItem.pciType = parts[1] || '17';
          currentItem.pciMarks = parts[4] || 'S::10';
        }
        break;
      }
      case 'GIR': {
        // GIR+3+5900000035314+00005006+UN+1J
        if (currentItem) {
          const prefix = parts[2] || '';
          const serial = parts[3] || '';
          // Only set start serial if not yet set for this CPS block
          if (!currentItem.girSerial && serial) {
            currentItem.girPrefix = prefix;
            currentItem.girSerial = serial;
          }

          if (prefix) detectedGirPrefix = prefix;
          if (serial) {
            detectedPadding = serial.length;
            const parsedNum = parseInt(serial, 10);
            if (!isNaN(parsedNum) && parsedNum > highestGirNumber) {
              highestGirNumber = parsedNum;
            }
          }
        }
        break;
      }
      case 'LIN': {
        // LIN+++A5906909501 9J36:IN
        if (currentItem) {
          const linComp = (parts[3] || '').split(':');
          currentItem.partNumber = linComp[0] || '';
          currentItem.partNumberQualifier = linComp[1] || 'IN';
        }
        break;
      }
    }
  }

  // Push last pending item
  if (currentItem && currentItem.partNumber) {
    items.push(currentItem as ASNItemLine);
  }

  if (items.length === 0) {
    warnings.push('Nie wykryto pozycji asortymentowych (LIN/CPS) w pliku EDIFACT. Zainicjowano domyślną strukturę pozycji.');
  }

  // Ensure totalQuantity is synced if missing
  for (const it of items) {
    if (!it.totalQuantity && it.packageCount && it.qtyPerPackage) {
      it.totalQuantity = it.packageCount * it.qtyPerPackage;
    }
  }

  return {
    data: {
      header,
      items: items.length > 0 ? items : DEFAULT_ASN_SAMPLE.items,
      girConfig: {
        prefix: detectedGirPrefix,
        currentNumber: highestGirNumber + 1,
        padding: detectedPadding,
        typeQualifier: '3',
        codeType1: 'UN',
        codeType2: '1J',
        autoIncrementPerLine: true
      }
    },
    warnings
  };
}
