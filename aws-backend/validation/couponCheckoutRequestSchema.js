import Joi from '@hapi/joi';
/**
 * @typedef {Object} CheckoutSessionRequestParams
 * @property {number} amount
 * @property {String} companyId
 * @property {String} customerEmail
 */
export const couponCheckoutRequestSchema = Joi.object({
  amount: Joi.number()
    .min(1000)
    .max(25000)
    .required(),
  companyId: Joi.string()
    .guid()
    .required(),
  customerEmail: Joi.string()
    .email()
    .required(),
});
