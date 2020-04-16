import Joi from '@hapi/joi';
import { zipCodeRegex, houseNumberRegex } from './regexes';

/** @param { Joi.PresenceMode } presenceMode */
export const companySchema = presenceMode =>
  Joi.object({
    companyName: Joi.string()
      .min(3)
      .max(30)
      .pattern(new RegExp(/^[0-9a-zA-Z\s\'\-\.]*$/i))
      // Allow string(3-30) with number, letters, ', - and .
      .presence(presenceMode),
    userId: Joi.string()
      .guid()
      .presence(presenceMode),
    companyId: Joi.string()
      .guid()
      .presence(presenceMode),
    acceptedTerms: Joi.bool().presence(presenceMode),
    copyAcceptedTerms: Joi.bool().presence(presenceMode),
    email: Joi.string().email().presence(presenceMode),
    companyDescription: Joi.string()
      .max(150)
      .pattern(new RegExp(/^[0-9a-zA-Z\s\'\-\.\:\/\/]*$/i))
      // Allow string with number, letters, ', -  , : , / and .
      .presence(presenceMode),
    address: Joi.object({
      city: Joi.string()
        .pattern(new RegExp(/^[a-zA-Z\s\'\-]*$/))
        // Allow string with number, letters, ' and -
        .presence(presenceMode),
      houseNumber: Joi.string()
        .pattern(houseNumberRegex)
        .presence(presenceMode),
      street: Joi.string()
        .pattern(new RegExp(/^[a-zA-Z\s\'\-]*$/i))
        // Allow string with letters, ' and -
        .presence(presenceMode),
      zipCode: Joi.string()
        .pattern(zipCodeRegex)
        .presence(presenceMode),
      latitude: Joi.number().presence(presenceMode),
      longitude: Joi.number().presence(presenceMode)
    }),
    stripeUserId: Joi.string()
      .pattern(new RegExp(/^acct_[a-zA-Z0-9]*$/))
      // Allow string in pattern 'acct_' + letters / numbers
      .presence(presenceMode),
    isVerified: Joi.bool().presence(presenceMode),
    stripeConnectToken: Joi.string()
      .guid()
      .presence(presenceMode),
  });
