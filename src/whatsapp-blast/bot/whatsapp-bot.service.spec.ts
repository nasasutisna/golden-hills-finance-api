/**
 * Unit tests for the pure bot helpers. These cover the trickiest logic
 * (identity resolution, unit matching, message parsing, menu keywords) without
 * a DB or socket. The orchestrator service is integration-shaped and is
 * exercised manually end-to-end (see the plan's verification section).
 */

import {
  computeFutureMonthSlots,
  extractText,
  findUnitByCode,
  hasMedia,
  isMenuKeyword,
  isMonthCountOverCap,
  isPersonalChat,
  isProofMimeType,
  jidToDigits,
  MAX_ADVANCE_MONTHS,
  matchResidentByPhone,
  parseMonthCount,
  ResidentLite,
  unitBelongsToBlocks,
  UnitLite,
} from './resident-resolver.helper';
import {
  buildIuranOutstandingText,
  buildIuranPayApprovedText,
  buildIuranPaySummaryText,
  buildMenuText,
  buildNoIuranOutstandingText,
  buildPayMonthChoiceInvalidText,
  buildPaySummaryText,
  formatIdr,
} from './bot-messages.helper';
import { formatMonthRangeCrossYear } from '../../ipl-payments/helpers/delinquent-units.helper';

describe('bot resident-resolver.helper', () => {
  describe('jidToDigits', () => {
    it('extracts the local part before @', () => {
      expect(jidToDigits('6281234567890@s.whatsapp.net')).toBe('6281234567890');
    });
    it('returns "" for empty/null', () => {
      expect(jidToDigits('')).toBe('');
      expect(jidToDigits(null)).toBe('');
      expect(jidToDigits(undefined)).toBe('');
    });
  });

  describe('isPersonalChat', () => {
    it('accepts the classic phone-number JID form', () => {
      expect(isPersonalChat('6281234567890@s.whatsapp.net')).toBe(true);
    });

    it('accepts the modern Linked-Identity (LID) JID form', () => {
      expect(isPersonalChat('25155774464233@lid')).toBe(true);
    });

    it.each(['120363xxx@g.us', 'status@broadcast', '123456@newsletter'])(
      'rejects non-personal JIDs (%s)',
      (jid) => {
        expect(isPersonalChat(jid)).toBe(false);
      },
    );

    it('rejects empty/null', () => {
      expect(isPersonalChat('')).toBe(false);
      expect(isPersonalChat(null)).toBe(false);
      expect(isPersonalChat(undefined)).toBe(false);
    });
  });

  describe('matchResidentByPhone', () => {
    const residents: ResidentLite[] = [
      {
        id: 'r1',
        firstName: 'Andi',
        lastName: 'Wijaya',
        phoneNumber: '081234567890', // local format
        alternatePhone: null,
        houseBlockId: null,
        houseUnitId: 'u1',
        unitNumber: 'A1-12',
        userId: null,
      },
      {
        id: 'r2',
        firstName: 'Budi',
        lastName: null,
        phoneNumber: null,
        alternatePhone: '+62 899 1122 3344', // spaced intl, in alternate
        houseBlockId: null,
        houseUnitId: 'u2',
        unitNumber: 'B2-05',
        userId: null,
      },
    ];

    it('matches a resident via primary phone regardless of stored format', () => {
      const hit = matchResidentByPhone(residents, '6281234567890');
      expect(hit?.id).toBe('r1');
    });

    it('matches a resident via alternate phone in a different format', () => {
      const hit = matchResidentByPhone(residents, '6289911223344');
      expect(hit?.id).toBe('r2');
    });

    it('returns null when nothing matches', () => {
      expect(matchResidentByPhone(residents, '6200000000000')).toBeNull();
    });

    it('returns null for empty digits', () => {
      expect(matchResidentByPhone(residents, '')).toBeNull();
    });
  });

  describe('findUnitByCode', () => {
    const units: UnitLite[] = [
      { id: 'u1', unitCode: 'A1-12', unitNumber: '12', houseBlockId: 'b1' },
      { id: 'u2', unitCode: 'B2-05', unitNumber: '05', houseBlockId: 'b2' },
    ];

    it('matches by unit code, case-insensitive', () => {
      expect(findUnitByCode(units, 'a1-12')?.id).toBe('u1');
      expect(findUnitByCode(units, 'A1-12')?.id).toBe('u1');
    });

    it('matches by unit number when code misses', () => {
      expect(findUnitByCode(units, '05')?.id).toBe('u2');
    });

    it('trims whitespace', () => {
      expect(findUnitByCode(units, '  A1-12  ')?.id).toBe('u1');
    });

    it('returns null when not found', () => {
      expect(findUnitByCode(units, 'Z9-99')).toBeNull();
      expect(findUnitByCode(units, '')).toBeNull();
    });
  });

  describe('isMenuKeyword', () => {
    it.each(['hi', 'Halo', 'ADMIN', 'menu', 'start'])(
      'treats %s as a menu keyword',
      (word) => {
        expect(isMenuKeyword(word)).toBe(true);
      },
    );

    it.each(['1', '0', 'ipl', '', 'berapa tagihan'])(
      'does NOT treat %s as a menu keyword',
      (word) => {
        expect(isMenuKeyword(word)).toBe(false);
      },
    );
  });

  describe('extractText / hasMedia', () => {
    it('reads plain conversation text', () => {
      expect(extractText({ message: { conversation: 'Halo' } })).toBe('Halo');
    });

    it('reads extended (quoted) text', () => {
      expect(
        extractText({ message: { extendedTextMessage: { text: '1' } } }),
      ).toBe('1');
    });

    it('returns "" when there is no text body', () => {
      expect(extractText({ message: { imageMessage: {} } })).toBe('');
      expect(extractText({})).toBe('');
    });

    it('detects media attachments', () => {
      expect(hasMedia({ message: { imageMessage: {} } })).toBe(true);
      expect(hasMedia({ message: { documentMessage: {} } })).toBe(true);
      expect(hasMedia({ message: { conversation: 'hi' } })).toBe(false);
      expect(hasMedia({})).toBe(false);
    });
  });
});

describe('bot-messages.helper', () => {
  it('formats IDR with thousands separators and no decimals', () => {
    expect(formatIdr(1500000)).toMatch(/1\.500\.000/);
    expect(formatIdr(0)).toMatch(/0/);
    expect(formatIdr(-100)).toMatch(/0/);
  });

  it('exposes all five menu options including Iuran Warga', () => {
    const menu = buildMenuText();
    expect(menu).toContain('Cek Tagihan IPL');
    expect(menu).toContain('Bayar IPL');
    expect(menu).toContain('Cek Iuran Warga');
    expect(menu).toContain('Bayar Iuran Warga');
    expect(menu).toContain('Bicara dengan Admin');
  });
});

describe('Iuran Warga message builders', () => {
  describe('buildIuranOutstandingText', () => {
    it('renders the iuran label, range, month count and total', () => {
      const text = buildIuranOutstandingText({
        name: 'Andi',
        unit: 'A1-12',
        block: 'Blok A',
        monthRange: 'Januari – Maret 2026',
        months: 3,
        amount: 60000,
        paymentInfo: 'BCA 123',
        companyName: 'Golden Hills Finance',
      });
      expect(text).toContain('Iuran Warga');
      expect(text).not.toContain('IPL'); // must not leak the IPL label
      expect(text).toContain('A1-12');
      expect(text).toContain('Januari – Maret 2026');
      expect(text).toContain('3 bulan');
      expect(text).toMatch(/60\.000/);
    });
  });

  describe('buildNoIuranOutstandingText', () => {
    it('greets by name when provided and references the year', () => {
      const text = buildNoIuranOutstandingText('Andi', 2026);
      expect(text).toContain('Yth. Andi');
      expect(text).toContain('Iuran Warga');
      expect(text).toContain('2026');
    });

    it('falls back to a generic greeting without a name', () => {
      expect(buildNoIuranOutstandingText(null, 2026)).toContain('Yth. Bapak/Ibu');
    });
  });

  describe('buildIuranPaySummaryText', () => {
    it('lists the outstanding months and offers advance beyond them', () => {
      const text = buildIuranPaySummaryText({
        name: 'Andi',
        unit: 'A1-12',
        block: 'Blok A',
        monthRangeLabel: 'April – Mei 2026',
        outstandingCount: 2,
        monthlyRate: 20000,
        totalAmount: 40000,
        paymentInfo: 'BCA 123',
        advanceCap: MAX_ADVANCE_MONTHS,
      });
      expect(text).toContain('Iuran Warga');
      expect(text).toContain('April – Mei 2026');
      expect(text).toContain(`1–${MAX_ADVANCE_MONTHS}`); // advance-aware range up to the cap
      expect(text).toMatch(/40\.000/);
    });

    it('offers a pure bayar-di-muka prompt when there is no tunggakan', () => {
      const text = buildIuranPaySummaryText({
        name: 'Andi',
        unit: 'A1-12',
        block: null,
        monthRangeLabel: null,
        outstandingCount: 0,
        monthlyRate: 20000,
        totalAmount: 0,
        paymentInfo: 'BCA 123',
        advanceCap: MAX_ADVANCE_MONTHS,
      });
      expect(text).toContain('Tidak ada tunggakan');
      expect(text.toLowerCase()).toContain('di muka');
      expect(text).toContain(`1–${MAX_ADVANCE_MONTHS}`);
    });
  });

  describe('buildIuranPayApprovedText', () => {
    it('announces approval with the reference number', () => {
      const text = buildIuranPayApprovedText('Andi', 'REF-20260801-0001');
      expect(text).toContain('disetujui');
      expect(text).toContain('REF-20260801-0001');
    });
  });
});

describe('Bayar IPL helpers', () => {
  describe('parseMonthCount', () => {
    it('accepts a digit in range, including advance beyond outstanding', () => {
      expect(parseMonthCount('1', { outstanding: 5, maxTotal: 60 })).toBe(1);
      expect(parseMonthCount('3', { outstanding: 5, maxTotal: 60 })).toBe(3);
      // 9 with only 4 tunggakan → 4 tunggakan + 5 bayar di muka (NOT clamped)
      expect(parseMonthCount('9', { outstanding: 4, maxTotal: 60 })).toBe(9);
    });

    it('"semua" / "all" resolves to the outstanding count (lunasi tunggakan)', () => {
      expect(parseMonthCount('semua', { outstanding: 6, maxTotal: 60 })).toBe(6);
      expect(parseMonthCount('all', { outstanding: 6, maxTotal: 60 })).toBe(6);
    });

    it('"semua" with zero outstanding is meaningless → null', () => {
      expect(parseMonthCount('semua', { outstanding: 0, maxTotal: 60 })).toBeNull();
    });

    it('rejects counts above the typo-guard cap', () => {
      expect(parseMonthCount('61', { outstanding: 4, maxTotal: 60 })).toBeNull();
      expect(parseMonthCount('9999', { outstanding: 4, maxTotal: 60 })).toBeNull();
    });

    it('accepts the cap itself', () => {
      expect(parseMonthCount('60', { outstanding: 4, maxTotal: 60 })).toBe(60);
    });

    it('rejects non-numeric and out-of-range input', () => {
      expect(parseMonthCount('', { outstanding: 5, maxTotal: 60 })).toBeNull();
      expect(parseMonthCount('abc', { outstanding: 5, maxTotal: 60 })).toBeNull();
      expect(parseMonthCount('0', { outstanding: 5, maxTotal: 60 })).toBeNull();
    });
  });

  describe('unitBelongsToBlocks', () => {
    it('true when the unit block is in the list', () => {
      expect(unitBelongsToBlocks('blk-a', ['blk-a', 'blk-b'])).toBe(true);
    });

    it('false when missing or empty', () => {
      expect(unitBelongsToBlocks('blk-c', ['blk-a'])).toBe(false);
      expect(unitBelongsToBlocks(null, ['blk-a'])).toBe(false);
      expect(unitBelongsToBlocks('blk-a', [])).toBe(false);
    });
  });

  describe('isProofMimeType', () => {
    it('accepts images and pdf, case-insensitively', () => {
      expect(isProofMimeType('image/jpeg')).toBe(true);
      expect(isProofMimeType('image/png')).toBe(true);
      expect(isProofMimeType('application/pdf')).toBe(true);
      expect(isProofMimeType('IMAGE/PNG')).toBe(true);
    });

    it('rejects unsupported types', () => {
      expect(isProofMimeType('video/mp4')).toBe(false);
      expect(isProofMimeType('')).toBe(false);
      expect(isProofMimeType(null)).toBe(false);
    });
  });
});

describe('advance-payment (bayar di muka) helpers', () => {
  describe('computeFutureMonthSlots', () => {
    it('returns consecutive months starting the month after the anchor', () => {
      expect(computeFutureMonthSlots(7, 2026, 2)).toEqual([
        { month: 8, year: 2026 },
        { month: 9, year: 2026 },
      ]);
    });

    it('rolls over Dec → Jan of the next year', () => {
      expect(computeFutureMonthSlots(12, 2026, 3)).toEqual([
        { month: 1, year: 2027 },
        { month: 2, year: 2027 },
        { month: 3, year: 2027 },
      ]);
    });

    it('spans multiple years', () => {
      const slots = computeFutureMonthSlots(11, 2026, 14);
      expect(slots).toHaveLength(14);
      expect(slots[0]).toEqual({ month: 12, year: 2026 });
      expect(slots[13]).toEqual({ month: 1, year: 2028 });
    });

    it('returns [] for non-positive count', () => {
      expect(computeFutureMonthSlots(7, 2026, 0)).toEqual([]);
      expect(computeFutureMonthSlots(7, 2026, -3)).toEqual([]);
    });
  });

  describe('isMonthCountOverCap', () => {
    it('true only for whole numbers above the cap', () => {
      expect(isMonthCountOverCap('61', 60)).toBe(true);
      expect(isMonthCountOverCap('9999', 60)).toBe(true);
      expect(isMonthCountOverCap('60', 60)).toBe(false);
      expect(isMonthCountOverCap('5', 60)).toBe(false);
    });

    it('false for non-numeric / empty input', () => {
      expect(isMonthCountOverCap('abc', 60)).toBe(false);
      expect(isMonthCountOverCap('semua', 60)).toBe(false);
      expect(isMonthCountOverCap('', 60)).toBe(false);
      expect(isMonthCountOverCap(null, 60)).toBe(false);
    });
  });

  describe('formatMonthRangeCrossYear', () => {
    it('renders a single month without a range dash', () => {
      expect(formatMonthRangeCrossYear({ month: 7, year: 2026 }, { month: 7, year: 2026 })).toBe(
        'Juli 2026',
      );
    });

    it('renders a same-year range identically to the legacy helper', () => {
      expect(formatMonthRangeCrossYear({ month: 5, year: 2026 }, { month: 7, year: 2026 })).toBe(
        'Mei 2026 – Juli 2026',
      );
    });

    it('renders a cross-year range', () => {
      expect(formatMonthRangeCrossYear({ month: 8, year: 2026 }, { month: 3, year: 2027 })).toBe(
        'Agustus 2026 – Maret 2027',
      );
    });
  });

  describe('buildPaySummaryText (IPL, advance-aware)', () => {
    it('lists tunggakan and allows paying more than outstanding', () => {
      const text = buildPaySummaryText({
        name: 'Andi',
        unit: 'A1-12',
        block: 'Blok A',
        monthRangeLabel: 'Mei – Juli 2026',
        outstandingCount: 3,
        monthlyRate: 250000,
        totalAmount: 750000,
        paymentInfo: 'BCA 123',
        advanceCap: MAX_ADVANCE_MONTHS,
      });
      expect(text).toContain('Mei – Juli 2026');
      expect(text).toContain('3 bulan');
      expect(text).toContain(`1–${MAX_ADVANCE_MONTHS}`);
      expect(text.toLowerCase()).toContain('di muka');
      expect(text).toMatch(/750\.000/);
    });

    it('offers a pure advance prompt when outstanding is 0', () => {
      const text = buildPaySummaryText({
        name: 'Andi',
        unit: 'A1-12',
        block: null,
        monthRangeLabel: null,
        outstandingCount: 0,
        monthlyRate: 250000,
        totalAmount: 0,
        paymentInfo: 'BCA 123',
        advanceCap: MAX_ADVANCE_MONTHS,
      });
      expect(text).toContain('Tidak ada tunggakan');
      expect(text.toLowerCase()).toContain('di muka');
    });
  });

  describe('buildPayMonthChoiceInvalidText', () => {
    it('generic guidance for unrecognized input', () => {
      const text = buildPayMonthChoiceInvalidText(60, 'invalid');
      expect(text).toContain('1');
      expect(text).toContain('60');
    });

    it('specific "too large" message when over the cap', () => {
      const text = buildPayMonthChoiceInvalidText(60, 'over-cap');
      expect(text.toLowerCase()).toContain('terlalu besar');
      expect(text).toContain('60 bulan');
    });
  });
});
