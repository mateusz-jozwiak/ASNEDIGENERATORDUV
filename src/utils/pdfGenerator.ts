import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ASNData, ASNItemLine } from '../types/asn';
import { formatGIRSerial } from './girCounter';

/**
 * Sanitizes Polish diacritics and special Unicode symbols to standard Latin characters.
 * Ensures 100% reliable rendering without font encoding errors or corrupt characters across all PDF viewers.
 */
export function toPdfText(str?: string | number | null): string {
  if (str === undefined || str === null) return '';
  let text = String(str);
  const replaceMap: Record<string, string> = {
    // Polish diacritics
    'ą': 'a', 'Ą': 'A',
    'ć': 'c', 'Ć': 'C',
    'ę': 'e', 'Ę': 'E',
    'ł': 'l', 'Ł': 'L',
    'ń': 'n', 'Ń': 'N',
    'ó': 'o', 'Ó': 'O',
    'ś': 's', 'Ś': 'S',
    'ź': 'z', 'Ź': 'Z',
    'ż': 'z', 'Ż': 'Z',
    // Arrows & symbols that cause corrupt bytes in WinAnsi
    '→': ' - ', '←': ' - ', '↔': ' - ', '⇒': ' - ',
    '–': '-', '—': '-',
    '×': 'x',
    '•': '*', '·': '*',
    '„': '"', '”': '"', '«': '"', '»': '"'
  };

  text = text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ→←↔⇒–—×•·„”«»]/g, match => replaceMap[match] || match);
  // Strip any remaining non-ASCII characters to guarantee clean helvetica rendering
  text = text.replace(/[^\x20-\x7E\n\r\t]/g, '');
  return text;
}

/**
 * Formats a clean GIR range for the PDF document that fits on a single line.
 * e.g. "00005132 - 00005140 (9 op.)" or "00005125"
 */
function formatPdfGIRRange(item: ASNItemLine): string {
  if (!item.girSerial) return '-';
  const packCount = Math.max(1, item.packageCount || 1);
  const baseNum = parseInt(item.girSerial, 10);
  if (isNaN(baseNum)) return item.girSerial;

  const padLen = item.girSerial.length || 8;
  if (packCount <= 1) {
    return item.girSerial;
  }
  const endSerial = formatGIRSerial(baseNum + packCount - 1, padLen);
  return `${item.girSerial} - ${endSerial} (${packCount} op.)`;
}

/**
 * Formats ISO date or datetime string to a human-readable format: YYYY-MM-DD HH:mm
 */
function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const cleaned = dateStr.replace('T', ' ');
    if (cleaned.length >= 16) {
      return cleaned.substring(0, 16);
    }
    return cleaned;
  } catch {
    return dateStr;
  }
}

/**
 * Generates and downloads a professional Consignment Note / Shipping Manifest PDF
 * based on ASN (DESADV) data.
 */
export function generateConsignmentNotePDF(data: ASNData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~297 mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // ~186 mm

  const totalPackages = data.items.reduce((sum, it) => sum + (Number(it.packageCount) || 0), 0);
  const totalUnits = data.items.reduce((sum, it) => sum + (Number(it.totalQuantity) || 0), 0);

  // --- 1. TOP HEADER ACCENT BAR ---
  const headerBarHeight = 22;
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, 10, contentWidth, headerBarHeight, 2, 2, 'F');

  // Title on the left
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(toPdfText('KARTA PRZEWOZOWA / LIST PRZEWOZOWY'), margin + 5, 17.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(toPdfText('DOKUMENT WYSYLKOWY (DESADV EDIFACT D96A / VDA 4987)'), margin + 5, 23);
  doc.text(toPdfText('Wykaz ladunku i etykiet logistycznych Handling Units (GIR)'), margin + 5, 27.5);

  // Badge on the right (ASN / WZ / Date)
  const badgeWidth = 62;
  const badgeHeight = 17;
  const badgeX = pageWidth - margin - badgeWidth - 3;
  const badgeY = 12.5;

  doc.setFillColor(51, 65, 85); // slate-700
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'F');

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.text(toPdfText('NR ASN:'), badgeX + 3.5, badgeY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(96, 165, 250); // blue-400
  doc.text(toPdfText(data.header.asnNumber || '00034'), badgeX + 18, badgeY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(toPdfText('NR WZ:'), badgeX + 3.5, badgeY + 9.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(toPdfText(data.header.deliveryNoteRef || data.header.asnNumber || '-'), badgeX + 18, badgeY + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(toPdfText(`Data: ${formatDisplayDate(data.header.documentDate)}`), badgeX + 3.5, badgeY + 14.5);

  // --- 2. PARTNER & TRANSPORT 4-BOX GRID ---
  let currentY = 35;
  const colWidth = (contentWidth - 4) / 2; // ~91 mm
  const boxHeight1 = 29; // Nadawca / Odbiorca
  const boxHeight2 = 25; // Transport / Wagi

  // Helper for clean location line
  const consignorLocation = [
    data.header.consignor.postalCode,
    data.header.consignor.city,
    data.header.consignor.countryCode ? `(${data.header.consignor.countryCode})` : ''
  ].filter(Boolean).join(' ');

  const consigneeLocation = [
    data.header.consignee.postalCode,
    data.header.consignee.city,
    data.header.consignee.countryCode ? `(${data.header.consignee.countryCode})` : ''
  ].filter(Boolean).join(' ');

  // Box 1: NADAWCA (Consignor)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, currentY, colWidth, boxHeight1, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, colWidth, 6, 1.5, 1.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(toPdfText('1. NADAWCA (CONSIGNOR / SELLER)'), margin + 3.5, currentY + 4.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText(data.header.consignor.name || 'ORSAMOTO SP. Z O.O.'), margin + 3.5, currentY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(toPdfText(`Kod dostawcy: ${data.header.consignor.code || '5900000035314'}`), margin + 3.5, currentY + 15);
  doc.text(toPdfText(`Adres: ${data.header.consignor.street || 'ul. Przemyslowa 12'}`), margin + 3.5, currentY + 19.5);
  doc.text(
    toPdfText(consignorLocation.trim() ? `Lokalizacja: ${consignorLocation}` : `Kraj: ${data.header.consignor.countryCode || 'PL'}`),
    margin + 3.5,
    currentY + 24
  );

  // Box 2: ODBIORCA (Consignee)
  const col2X = margin + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, currentY, colWidth, boxHeight1, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(col2X, currentY, colWidth, 6, 1.5, 1.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(toPdfText('2. ODBIORCA I ROZLADUNEK (CONSIGNEE)'), col2X + 3.5, currentY + 4.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText(data.header.consignee.name || 'DUVENBECK LOGISTIK GMBH'), col2X + 3.5, currentY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(toPdfText(`Kod klienta: ${data.header.consignee.code || 'O0177X1JQEDILOG-HOR'}`), col2X + 3.5, currentY + 15);
  doc.text(toPdfText(`Adres: ${data.header.consignee.street || 'Logistikstrasse 5'}`), col2X + 3.5, currentY + 19.5);
  
  // Unloading point and location on last line
  const locAndGate = [
    consigneeLocation.trim() || `Kraj: ${data.header.consignee.countryCode || 'DE'}`,
    data.header.unloadingPoint ? `Brama (LOC): ${data.header.unloadingPoint}` : ''
  ].filter(Boolean).join(' | ');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text(toPdfText(locAndGate), col2X + 3.5, currentY + 24);

  // Next row of boxes: TRANSPORT & WAGI
  currentY += boxHeight1 + 3;

  // Box 3: DANE TRANSPORTOWE
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, colWidth, boxHeight2, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, colWidth, 6, 1.5, 1.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(toPdfText('3. DANE TRANSPORTU I PRZEWOZNIKA'), margin + 3.5, currentY + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(toPdfText(`Przewoznik (Carrier): ${data.header.carrierCode || 'Nie podano'}`), margin + 3.5, currentY + 10.5);
  doc.text(toPdfText(`Rodzaj transportu: Drogowy (Road / TDT 3)`), margin + 3.5, currentY + 14.8);
  doc.text(toPdfText(`Nr rejestracyjny pojazdu: ${data.header.vehiclePlate || 'Nie podano'}`), margin + 3.5, currentY + 19);
  doc.text(
    toPdfText(`Wysylka: ${formatDisplayDate(data.header.despatchDate)} | Dostawa: ${formatDisplayDate(data.header.estimatedDeliveryDate)}`),
    margin + 3.5,
    currentY + 23
  );

  // Box 4: PARAMETRY LADUNKU (Totals)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, currentY, colWidth, boxHeight2, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(col2X, currentY, colWidth, 6, 1.5, 1.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(toPdfText('4. PARAMETRY LADUNKU I WAGI'), col2X + 3.5, currentY + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  doc.text(toPdfText('Masa brutto (Gross):'), col2X + 3.5, currentY + 10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText(`${data.header.grossWeightKg.toFixed(2)} kg`), col2X + 38, currentY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(toPdfText('Masa netto (Net):'), col2X + 3.5, currentY + 14.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText(`${data.header.netWeightKg.toFixed(2)} kg`), col2X + 38, currentY + 14.8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(toPdfText('Liczba opakowan:'), col2X + 3.5, currentY + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text(toPdfText(`${totalPackages} kartonow / jednostek`), col2X + 38, currentY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(toPdfText('Laczna ilosc sztuk:'), col2X + 3.5, currentY + 23);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText(`${totalUnits} PCE (w ${data.items.length} poz. CPS)`), col2X + 38, currentY + 23);

  // --- 3. ITEMS TABLE SECTION ---
  currentY += boxHeight2 + 4;

  const tableHead = [
    [
      toPdfText('CPS'),
      toPdfText('Numer Artykulu / LIN'),
      toPdfText('Opis Towaru'),
      toPdfText('Opak.'),
      toPdfText('Szt./Op.'),
      toPdfText('Ilosc'),
      toPdfText('Nr Zlecenia (PO)'),
      toPdfText('Etykiety GIR (Handling Units)')
    ]
  ];

  const tableBody = data.items.map((item) => {
    const rangeText = formatPdfGIRRange(item);
    return [
      String(item.cpsSequence),
      toPdfText(item.partNumber),
      toPdfText(item.partDescription || '-'),
      toPdfText(`${item.packageCount} x ${item.packageType}`),
      String(item.qtyPerPackage),
      toPdfText(`${item.totalQuantity} ${item.unitOfMeasure}`),
      toPdfText(item.orderNumber || '-'),
      toPdfText(rangeText)
    ];
  });

  // Table summary row with merged colSpan: 3 so "SUMA" never wraps
  const tableFoot = [
    [
      {
        content: toPdfText(`SUMA: ${data.items.length} pozycji LIN`),
        colSpan: 3,
        styles: { halign: 'left' as const, fontStyle: 'bold' as const }
      },
      {
        content: toPdfText(`${totalPackages} op.`),
        styles: { halign: 'center' as const, fontStyle: 'bold' as const }
      },
      {
        content: ''
      },
      {
        content: toPdfText(`${totalUnits} szt.`),
        styles: { halign: 'center' as const, fontStyle: 'bold' as const }
      },
      {
        content: ''
      },
      {
        content: toPdfText(`${totalPackages} etykiet GIR`),
        styles: { halign: 'left' as const, fontStyle: 'bold' as const }
      }
    ]
  ];

  // Total width: 9 + 36 + 25 + 18 + 14 + 18 + 26 + 40 = 186 mm
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: tableHead,
    body: tableBody,
    foot: tableFoot,
    theme: 'grid',
    showHead: 'everyPage',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 1.8,
      overflow: 'linebreak',
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 36, fontStyle: 'bold' },
      2: { cellWidth: 25 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 26 },
      7: { cellWidth: 40, fontStyle: 'bold', textColor: [29, 78, 216] }
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // --- 4. FOOTER ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      toPdfText(`EDIXpress Gen-Pro | Dokument wygenerowany na podstawie EDIFACT DESADV D96A (ASN ${data.header.asnNumber || '00034'})`),
      margin,
      pageHeight - 6
    );

    const pageText = toPdfText(`Strona ${i} z ${totalPages}`);
    doc.text(pageText, pageWidth - margin - 18, pageHeight - 6);
  }

  // Trigger download in browser
  const filename = `Karta_Przewozowa_ASN_${data.header.asnNumber || 'DESADV'}.pdf`;
  doc.save(filename);
  return doc;
}

