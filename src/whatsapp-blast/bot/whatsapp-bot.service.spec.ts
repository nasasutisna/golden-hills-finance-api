/**
 * Unit tests for the pure bot helpers. These cover the trickiest logic
 * (identity resolution, unit matching, message parsing, menu keywords) without
 * a DB or socket. The orchestrator service is integration-shaped and is
 * exercised manually end-to-end (see the plan's verification section).
 */

import {
  extractText,
  findUnitByCode,
  hasMedia,
  isMenuKeyword,
  isPersonalChat,
  isProofMimeType,
  jidToDigits,
  matchResidentByPhone,
  parseMonthCount,
  ResidentLite,
  unitBelongsToBlocks,
  UnitLite,
} from './resident-resolver.helper';
import { formatIdr } from './bot-messages.helper';

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
});

describe('Bayar IPL helpers', () => {
  describe('parseMonthCount', () => {
    it('accepts a digit in range', () => {
      expect(parseMonthCount('1', 5)).toBe(1);
      expect(parseMonthCount('3', 5)).toBe(3);
    });

    it('clamps above the maximum down to the maximum', () => {
      expect(parseMonthCount('9', 4)).toBe(4);
    });

    it('"semua" / "all" resolves to the maximum', () => {
      expect(parseMonthCount('semua', 6)).toBe(6);
      expect(parseMonthCount('all', 6)).toBe(6);
    });

    it('rejects non-numeric and out-of-range input', () => {
      expect(parseMonthCount('', 5)).toBeNull();
      expect(parseMonthCount('abc', 5)).toBeNull();
      expect(parseMonthCount('0', 5)).toBeNull();
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
