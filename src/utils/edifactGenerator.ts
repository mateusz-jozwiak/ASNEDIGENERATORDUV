import { ASNData } from '../types/asn';

function formatYYMMDDHHMM(dtStr: string): { yymmdd: string; hhmm: string; ccyymmddhhmm: string; ccyymmdd: string } {
  if (!dtStr) {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const ccyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return {
      yymmdd: `${yy}${mm}${dd}`,
      hhmm: `${hh}${min}`,
      ccyymmddhhmm: `${ccyy}${mm}${dd}${hh}${min}`,
      ccyymmdd: `${ccyy}${mm}${dd}`
    };
  }

  // Expecting YYYY-MM-DDTHH:mm
  const clean = dtStr.replace(/[^0-9]/g, '');
  const ccyy = clean.slice(0, 4) || '2026';
  const yy = ccyy.slice(2);
  const mm = clean.slice(4, 6) || '01';
  const dd = clean.slice(6, 8) || '01';
  const hh = clean.slice(8, 10) || '00';
  const min = clean.slice(10, 12) || '00';

  return {
    yymmdd: `${yy}${mm}${dd}`,
    hhmm: `${hh}${min}`,
    ccyymmddhhmm: `${ccyy}${mm}${dd}${hh}${min}`,
    ccyymmdd: `${ccyy}${mm}${dd}`
  };
}

/**
 * Generates an official EDIFACT DESADV D:96A:UN message string with exact segment counting.
 */
export function generateEDIFACTDESADV(data: ASNData): string {
  const { header, items } = data;
  const docDates = formatYYMMDDHHMM(header.documentDate);
  const delDates = formatYYMMDDHHMM(header.estimatedDeliveryDate);
  const despDates = formatYYMMDDHHMM(header.despatchDate);
  const refDates = formatYYMMDDHHMM(header.referenceDate);

  const segments: string[] = [];

  // UNA Service string advice (separator definition)
  const una = `UNA:+.? '`;

  // UNB Interchange header
  // e.g. UNB+UNOA:3+5900000035314+O0177X1JQEDILOG-HOR::2674+260827:1049+1++DESADV'
  const unb = `UNB+${header.syntaxIdentifier || 'UNOA:3'}+${header.unbSender}+${header.unbRecipient}+${docDates.yymmdd}:${docDates.hhmm}+${header.unbInterchangeRef || '1'}++DESADV'`;

  // UNH Message header
  segments.push(`UNH+1+DESADV:D:96A:UN'`);

  // BGM
  segments.push(`BGM+${header.documentType || '351'}+${header.asnNumber}'`);

  // DTMs
  segments.push(`DTM+137:${docDates.ccyymmddhhmm}:203'`);
  segments.push(`DTM+132:${delDates.ccyymmddhhmm}:203'`);
  segments.push(`DTM+11:${despDates.ccyymmddhhmm}:203'`);

  // MEA Weights
  segments.push(`MEA+AAX+G+KGM:${header.grossWeightKg.toFixed(3)}'`);
  segments.push(`MEA+AAX+N+KGM:${header.netWeightKg.toFixed(3)}'`);

  // RFF DQ
  segments.push(`RFF+DQ:${header.deliveryNoteRef || header.asnNumber}'`);
  segments.push(`DTM+171:${refDates.ccyymmdd}:102'`);

  // NAD Partners
  if (header.consignor?.code) {
    segments.push(`NAD+CZ+${header.consignor.code}::${header.consignor.codeQualifier || '92'}++${header.consignor.name}'`);
  }
  if (header.seller?.code) {
    segments.push(`NAD+SE+${header.seller.code}::${header.seller.codeQualifier || '92'}++${header.seller.name}'`);
  }
  if (header.buyer?.code) {
    segments.push(`NAD+BY+${header.buyer.code}::${header.buyer.codeQualifier || '92'}++${header.buyer.name}'`);
  }
  if (header.consignee?.code) {
    segments.push(`NAD+CN+${header.consignee.code}::${header.consignee.codeQualifier || '92'}++${header.consignee.name}'`);
  }

  // LOC
  if (header.unloadingPoint) {
    segments.push(`LOC+11+${header.unloadingPoint}::${header.unloadingPointQualifier || '92'}'`);
  }

  // TDT
  segments.push(`TDT+${header.transportStageQualifier || '12'}++${header.transportMode || '3'}++${header.carrierCode}::${header.carrierQualifier || '92'}'`);

  // CPS Items
  items.forEach((item, index) => {
    const cpsNum = index + 1;
    segments.push(`CPS+${cpsNum}++1'`);
    segments.push(`PAC+${item.packageCount}++${item.packageType || 'BOX'}::${item.packageTypeQualifier || '92'}'`);
    segments.push(`QTY+52:${item.qtyPerPackage}:${item.unitOfMeasure || 'PCE'}'`);
    segments.push(`PCI+${item.pciType || '17'}+++${item.pciMarks || 'S::10'}'`);

    // Generate individual sequential GIR segments for each package (PAC count)
    const baseNum = parseInt(item.girSerial, 10) || 1;
    const padLen = item.girSerial?.length || 8;
    const packCount = Math.max(1, item.packageCount || 1);

    for (let p = 0; p < packCount; p++) {
      const currentSerialStr = String(baseNum + p).padStart(padLen, '0');
      segments.push(`GIR+3+${item.girPrefix || '5900000035314'}+${currentSerialStr}+UN+1J'`);
    }

    segments.push(`LIN+++${item.partNumber}:${item.partNumberQualifier || 'IN'}'`);
    segments.push(`QTY+12:${item.totalQuantity}:${item.unitOfMeasure || 'PCE'}'`);
    if (item.orderNumber) {
      segments.push(`RFF+ON:${item.orderNumber}'`);
    }
  });

  // UNT Count includes UNH and UNT itself
  const untCount = segments.length + 1;
  segments.push(`UNT+${untCount}+1'`);

  // UNZ
  const unz = `UNZ+1+${header.unbInterchangeRef || '1'}'`;

  return [una, unb, ...segments, unz].join('\n');
}
