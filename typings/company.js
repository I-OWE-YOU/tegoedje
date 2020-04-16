/**
 * @typedef {Object} Company
 * @property {boolean} acceptedTerms
 * @property {string} companyName
 * @property {string} email
 * @property {Address} address
 */

/**
 * @typedef {object} Address
 * @property {string} city
 * @property {string} houseNumber
 * @property {string} street
 * @property {string} zipCode
 * @property {number} latitude
 * @property {number} longitude
 */

/**
 * @typedef {object} CompanyFlatten
 * @property {boolean} acceptedTerms
 * @property {string} companyName
 * @property {string} email
 * @property {string} city
 * @property {string} houseNumber
 * @property {string} street
 * @property {string} zipCode
 * @property {number} latitude
 * @property {number} longitude
 */

exports.empty = {};
