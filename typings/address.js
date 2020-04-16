/**
 * @typedef {Object} Address
 * @property {Standard} standard
 * @property {String} longt
 * @property {String} latt
 * @property {Alt} alt
 * @property {Object} error
 */

/**
 * @typedef {Object} Standard
 * @property {String} addresst
 * @property {String} stnumber
 * @property {Object} region
 * @property {String} postal
 * @property {String} city
 * @property {String} prov
 * @property {String} countryname
 * @property {string} confidence
 */

/**
 * @typedef {Object} Alt
 * @type {Loc} loc
 */

/**
 * @typedef {Object} Loc
 * @type {Streets} streets
 */

/**
 * @typedef {Object} Streets
 * @type {StreetAddress} street_address
 */

/**
 * @typedef {Object} StreetAddress
 * @type {String} staddress
 * @type {String} stnumber
 */

exports.empty = {};
