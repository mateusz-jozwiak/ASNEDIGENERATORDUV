import { ASNData, ValidationError } from '../types/asn';
import { validateGIRUniqueness } from './girCounter';

export function validateASN(data: ASNData): ValidationError[] {
  const errors: ValidationError[] = [];
  const { header, items } = data;

  // 1. Header validations
  if (!header.asnNumber.trim()) {
    errors.push({
      id: 'err-asn-num',
      field: 'header.asnNumber',
      type: 'error',
      message: 'Brak numeru dokumentu ASN (BGM+351).'
    });
  }

  if (!header.unbSender.trim()) {
    errors.push({
      id: 'err-unb-sender',
      field: 'header.unbSender',
      type: 'warning',
      message: 'Brak identyfikatora nadawcy UNB (Sender ID).'
    });
  }

  if (!header.unbRecipient.trim()) {
    errors.push({
      id: 'err-unb-recip',
      field: 'header.unbRecipient',
      type: 'warning',
      message: 'Brak identyfikatora odbiorcy UNB (Recipient ID).'
    });
  }

  // Weight check
  if (header.netWeightKg > header.grossWeightKg && header.grossWeightKg > 0) {
    errors.push({
      id: 'err-weight-mismatch',
      field: 'header.weights',
      type: 'error',
      message: `Masa netto (${header.netWeightKg} kg) jest większa niż masa brutto (${header.grossWeightKg} kg).`
    });
  }

  // Date check
  if (header.despatchDate && header.estimatedDeliveryDate) {
    const desp = new Date(header.despatchDate).getTime();
    const del = new Date(header.estimatedDeliveryDate).getTime();
    if (del < desp) {
      errors.push({
        id: 'err-dates-order',
        field: 'header.dates',
        type: 'warning',
        message: 'Szacowana data dostawy (DTM+132) jest wcześniejsza niż data wysyłki (DTM+11).'
      });
    }
  }

  // 2. Items validations
  if (items.length === 0) {
    errors.push({
      id: 'err-no-items',
      field: 'items',
      type: 'error',
      message: 'Dokument ASN musi zawierać co najmniej jedną pozycję asortymentową (CPS/LIN).'
    });
  }

  // Check GIR uniqueness
  const girCheck = validateGIRUniqueness(items);
  if (!girCheck.isUnique) {
    errors.push({
      id: 'err-gir-duplicate',
      field: 'items.gir',
      type: 'error',
      message: `Wykryto zduplikowane numery GIR: ${girCheck.duplicates.join(', ')}. Każde opakowanie musi mieć unikalny numer seryjny.`
    });
  }

  // Item lines checks
  items.forEach((it, idx) => {
    const rowNum = idx + 1;

    if (!it.partNumber.trim()) {
      errors.push({
        id: `err-item-part-${it.id}`,
        field: `items[${idx}].partNumber`,
        type: 'error',
        message: `Wiersz #${rowNum}: Brak numeru artykułu / części (LIN).`
      });
    }

    if (!it.girSerial.trim()) {
      errors.push({
        id: `err-item-gir-${it.id}`,
        field: `items[${idx}].girSerial`,
        type: 'error',
        message: `Wiersz #${rowNum}: Brak numeru seryjnego GIR dla opakowania.`
      });
    }

    if (it.packageCount <= 0) {
      errors.push({
        id: `err-item-pac-${it.id}`,
        field: `items[${idx}].packageCount`,
        type: 'error',
        message: `Wiersz #${rowNum}: Ilość opakowań (PAC) musi być większa od zera.`
      });
    }

    const calculatedTotal = (it.packageCount || 0) * (it.qtyPerPackage || 0);
    if (it.totalQuantity !== calculatedTotal && calculatedTotal > 0) {
      errors.push({
        id: `err-item-calc-${it.id}`,
        field: `items[${idx}].totalQuantity`,
        type: 'warning',
        message: `Wiersz #${rowNum}: Ilość całkowita (${it.totalQuantity}) różni się od ilości wyliczonej (Opakowania ${it.packageCount} × Szt./Opak ${it.qtyPerPackage} = ${calculatedTotal}).`
      });
    }
  });

  return errors;
}
