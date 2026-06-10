// Subunit factors per currency
// A subunit is the smallest indivisible unit of a currency
// e.g. INR -> paisa (100 paisa = 1 rupee), USD -> cents (100 cents = 1 dollar)
const CURRENCY_SUBUNIT_FACTOR = Object.freeze({
    INR: 100,
    USD: 100,
    EUR: 100,
    GBP: 100,
    JPY: 1,    // no subunits
    KWD: 1000, // 1000 fils = 1 dinar
});

const DEFAULT_FACTOR = 100;

/**
 * Converts a major unit amount (e.g. rupees) to subunits (e.g. paisa)
 * Math.round handles floating point imprecision (e.g. 100.50 * 100 = 10049.999...)
 * @param {number} amount - amount in major units
 * @param {string} currency - ISO 4217 currency code (e.g. 'INR', 'USD')
 * @returns {number} amount in subunits as integer
 */
const toSubunits = (amount, currency) => {
    const factor = CURRENCY_SUBUNIT_FACTOR[currency] ?? DEFAULT_FACTOR;
    return Math.round(amount * factor);
};

/**
 * Converts a subunit amount (e.g. paisa) back to major units (e.g. rupees)
 * @param {number} amount - amount in subunits
 * @param {string} currency - ISO 4217 currency code (e.g. 'INR', 'USD')
 * @returns {number} amount in major units
 */
const toMajorUnit = (amount, currency) => {
    const factor = CURRENCY_SUBUNIT_FACTOR[currency] ?? DEFAULT_FACTOR;
    return amount / factor;
};

module.exports = { toSubunits, toMajorUnit, CURRENCY_SUBUNIT_FACTOR };
