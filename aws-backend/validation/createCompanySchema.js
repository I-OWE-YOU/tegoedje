import Joi from '@hapi/joi';

export const companySchema = presenceMode =>
	Joi.object({
		email: Joi.string()
			.email(),
		sub: Joi.string().presence(presenceMode)
	});
