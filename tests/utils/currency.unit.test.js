const { toSubunits, toMajorUnit, CURRENCY_SUBUNIT_FACTOR } = require('../../src/utils/currency');

describe('toSubunits', () => {
    it('converts INR rupees to paisa (factor 100)', () => {
        expect(toSubunits(100, 'INR')).toBe(10000);
    });

    it('converts USD dollars to cents (factor 100)', () => {
        expect(toSubunits(1.5, 'USD')).toBe(150);
    });

    it('converts JPY with no subunit (factor 1)', () => {
        expect(toSubunits(500, 'JPY')).toBe(500);
    });

    it('converts KWD dinars to fils (factor 1000)', () => {
        expect(toSubunits(1, 'KWD')).toBe(1000);
    });

    it('rounds floating-point imprecision correctly', () => {
        // 100.50 * 100 = 10049.999... without Math.round
        expect(toSubunits(100.50, 'INR')).toBe(10050);
    });

    it('uses default factor 100 for unknown currency', () => {
        expect(toSubunits(5, 'XYZ')).toBe(500);
    });

    it('handles zero amount', () => {
        expect(toSubunits(0, 'INR')).toBe(0);
    });
});

describe('toMajorUnit', () => {
    it('converts paisa to INR rupees', () => {
        expect(toMajorUnit(10000, 'INR')).toBe(100);
    });

    it('converts cents to USD dollars', () => {
        expect(toMajorUnit(150, 'USD')).toBe(1.5);
    });

    it('converts JPY with no subunit (factor 1)', () => {
        expect(toMajorUnit(500, 'JPY')).toBe(500);
    });

    it('converts KWD fils to dinars', () => {
        expect(toMajorUnit(1000, 'KWD')).toBe(1);
    });

    it('uses default factor 100 for unknown currency', () => {
        expect(toMajorUnit(500, 'XYZ')).toBe(5);
    });

    it('handles zero amount', () => {
        expect(toMajorUnit(0, 'INR')).toBe(0);
    });
});

describe('CURRENCY_SUBUNIT_FACTOR', () => {
    it('is frozen (immutable)', () => {
        expect(Object.isFrozen(CURRENCY_SUBUNIT_FACTOR)).toBe(true);
    });

    it('has expected entries', () => {
        expect(CURRENCY_SUBUNIT_FACTOR.INR).toBe(100);
        expect(CURRENCY_SUBUNIT_FACTOR.JPY).toBe(1);
        expect(CURRENCY_SUBUNIT_FACTOR.KWD).toBe(1000);
    });
});
