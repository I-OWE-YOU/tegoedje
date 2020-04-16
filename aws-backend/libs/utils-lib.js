/**
 * It flattens the object to one level, taking the last key as primary key
 * of the object
 * @param {object} ob
 * @returns {object}
 */
export const flattenObject = ob => {
  const toReturn = {};

  for (let i in ob) {
    if (!ob.hasOwnProperty(i)) continue;

    if (typeof ob[i] == 'object') {
      const flatObject = flattenObject(ob[i]);
      for (let x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;

        toReturn[x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
};

/**
 * @typedef {Object} Environment
 * @property {string} STAGE
 * @property {string} GEOCODE_API_KEY
 * @property {string} GEOCODE_ENDPOINT
 * @property {string} GEOCODE_REGION
 * @property {string} COMPANIES_TABLE_NAME
 * @property {string} USERS_TABLE_NAME
 * @property {string} STRIPE_CONNECT_URL
 * @property {string} APPLICATION_URL
 * @property {string} WEBFRONTEND_URL
 * @property {string} SEND_COUPON_EMAIL
 * @property {string} STRIPE_CHECKOUT_REDIRECT_SUCCESS
 * @property {string} STRIPE_CHECKOUT_REDIRECT_CANCEL
 * @property {boolean=} IS_OFFLINE
 */

/**
 * Wrapper to get typed environment variable
 * @returns {Environment | NodeJS.ProcessEnv}
 */
export function getEnvironment() {
  return process.env;
}
