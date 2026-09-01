import { ASNItemLine, GIRConfig } from '../types/asn';

const GIR_STORAGE_KEY = 'asn_gir_counter_state_v1';

export function loadSavedGIRConfig(defaultConfig: GIRConfig): GIRConfig {
  try {
    const saved = localStorage.getItem(GIR_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultConfig,
        ...parsed,
        currentNumber: Number(parsed.currentNumber) || defaultConfig.currentNumber
      };
    }
  } catch (err) {
    console.error('Error loading saved GIR counter:', err);
  }
  return defaultConfig;
}

export function saveGIRConfig(config: GIRConfig): void {
  try {
    localStorage.setItem(GIR_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving GIR counter:', err);
  }
}

/**
 * Formats a serial number with leading zeros (padding)
 * e.g. formatGIRSerial(5006, 8) -> "00005006"
 */
export function formatGIRSerial(num: number, padding: number = 8): string {
  const str = Math.max(0, num).toString();
  return str.padStart(padding, '0');
}

/**
 * Returns formatted GIR range string for an item line
 * e.g. "00005006 – 00005020 (15 kartonów)" or "00005036 (1 karton)"
 */
export function getGIRRangeText(item: ASNItemLine): string {
  if (!item.girSerial) return '—';
  const packCount = Math.max(1, item.packageCount || 1);
  const baseNum = parseInt(item.girSerial, 10);
  if (isNaN(baseNum)) return item.girSerial;

  const padLen = item.girSerial.length || 8;
  if (packCount <= 1) {
    return item.girSerial;
  }
  const endSerial = formatGIRSerial(baseNum + packCount - 1, padLen);
  return `${item.girSerial} → ${endSerial} (${packCount} etykiet)`;
}

/**
 * Assigns sequential GIR serial numbers to an array of ASN items starting from startNumber.
 * Each item reserves as many sequential serials as its packageCount (BOX count).
 */
export function assignSequentialGIRs(
  items: ASNItemLine[],
  config: GIRConfig,
  startNumber?: number
): { updatedItems: ASNItemLine[]; nextNumber: number } {
  let seq = typeof startNumber === 'number' ? startNumber : config.currentNumber;
  const padding = config.padding || 8;
  const prefix = config.prefix || '';

  const updatedItems = items.map(item => {
    const packCount = Math.max(1, item.packageCount || 1);
    const serial = formatGIRSerial(seq, padding);
    seq += packCount;
    return {
      ...item,
      girPrefix: prefix || item.girPrefix,
      girSerial: serial
    };
  });

  return {
    updatedItems,
    nextNumber: seq
  };
}

/**
 * Validates if all GIR serial numbers are unique within the ASN across all packages
 */
export function validateGIRUniqueness(items: ASNItemLine[]): { isUnique: boolean; duplicates: string[] } {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const it of items) {
    if (!it.girSerial) continue;
    const baseNum = parseInt(it.girSerial, 10);
    const padLen = it.girSerial.length || 8;
    const packCount = Math.max(1, it.packageCount || 1);

    for (let p = 0; p < packCount; p++) {
      const serial = isNaN(baseNum) ? it.girSerial : formatGIRSerial(baseNum + p, padLen);
      const fullGIR = `${it.girPrefix}-${serial}`;
      if (seen.has(fullGIR)) {
        duplicates.add(serial);
      } else {
        seen.add(fullGIR);
      }
    }
  }

  return {
    isUnique: duplicates.size === 0,
    duplicates: Array.from(duplicates)
  };
}
