import Joi from '@hapi/joi';

import { houseNumberRegex, zipCodeRegex } from './regexes';
/**
 * @typedef {Object} AddressRequestParams
 * @property {String} houseNumber
 * @property {String} postalCode
 */
export const addressRequestSchema = Joi.object({
  houseNumber: Joi.string()
    .regex(houseNumberRegex)
    .required(),
  postalCode: Joi.string()
    .regex(zipCodeRegex)
    .required(),
});
