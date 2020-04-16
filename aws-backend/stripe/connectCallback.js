import Stripe from 'stripe';
import * as secretManagerLib from '../libs/secretmanager-lib';
import { failure, redirect, redirectWithError } from '../libs/response-lib';
import * as dynamoDbLib from '../libs/dynamodb-lib';
import { getEnvironment } from '../libs/utils-lib';
// eslint-disable-next-line no-unused-vars
import typings from '../../typings/stripeSecrets';
import { companySchema } from '../validation/companySchema';
import { validationError } from '../libs/response-lib';

const env = getEnvironment();

export const main = async event => {
  /** @type {string} code - authorization code returned from Stripe */
  const code = event.queryStringParameters.code;
  const stripeConnectToken = event.queryStringParameters.state;
  const params = {
    TableName: env.COMPANIES_TABLE_NAME,
    ExpressionAttributeValues: {
      ':stripeConnectToken': stripeConnectToken
    },
    FilterExpression: 'stripeConnectToken = :stripeConnectToken'
  };

  console.log('Get the company based on the unique key provided by Stripe');
  let company;
  try {
    const response = await dynamoDbLib.call('scan', params);

    if (response.Count === 0) {
      const error = 'resource_not_found';
      const errorMsg = 'The company does not exist in the DB';
      console.error({ error, errorMsg, stripeConnectToken });
      return redirectWithError(env.APPLICATION_URL, error, errorMsg);
    }

    company = response.Items[0];
    console.log(`Successfully fetch the company with ID: ${company.companyId}`);
  } catch (e) {
    console.error(e);
    return failure({ status: false });
  }

  /** @type {string} error */
  const error = event.queryStringParameters.error;
  const secretName = `${env.STAGE}/stripe`;
  /** @type {typings.StripeSecrets} */
  let stripeSecrets;
  try {
    console.log(`Get secret with name ${secretName}`);
    stripeSecrets = await secretManagerLib.getSecrets(secretName);
  } catch (e) {
    console.error(e);
    return failure({ status: false });
  }

  console.log('Initialize Stripe');
  const stripe = Stripe(stripeSecrets.API_SECRET_KEY);

  if (error) {
    /** @type {string} error_description */
    const errorMsg = event.queryStringParameters.error_description;
    console.error({ error, errorMsg, companyId: company.companyId });

    await removeStripeConnectToken(company.companyId);

    return redirectWithError(env.APPLICATION_URL, error, errorMsg);
  }

  console.log('Try to connect the Company to Stripe');
  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code
  });

  if (response.error) {
    console.error({
      error: response.error,
      errorMsg: response.error_description
    });
    return failure(response.error_description);
  }

  console.log('Connection with Stripe was successful');

  const stripeUserId = response.stripe_user_id;
  const userDataFromStripe = await stripe.accounts.retrieve(stripeUserId);

  if (userDataFromStripe.error) {
    console.log('Failed to retrieve user data from stripe');
    console.error(userDataFromStripe);
    return failure(userDataFromStripe.error);
  }

  const { business_profile, settings, requirements } = userDataFromStripe;
  const isVerified =
    requirements.errors.length === 0 && !requirements.disabled_reason;

  console.log(
    `The account "${stripeUserId}" is ${isVerified ? '' : 'NOT'} verified.`
  );

  if (!isVerified) {
    console.log({
      errors: requirements.errors,
      disabledReason: requirements.disabled_reason
    });
  }

  const testValues = {
    companyId: company.companyId,
    stripeUserId: stripeUserId,
    companyName: settings.dashboard.display_name,
    companyDescription: business_profile.url,
    isVerified: isVerified
  };
  try {
    await companySchema('optional').validateAsync(testValues);
  } catch (e) {
    const errorMessages = e.details.map(detail => detail.message);
    return validationError(errorMessages);
  }

  const updateParams = {
    TableName: env.COMPANIES_TABLE_NAME,
    Key: {
      companyId: company.companyId
    },
    AttributeUpdates: {
      stripeUserId: {
        Value: stripeUserId,
        Action: 'PUT'
      },
      companyName: {
        Value: settings.dashboard.display_name,
        Action: 'PUT'
      },
      companyDescription: {
        Value: business_profile.url,
        Action: 'PUT'
      },
      isVerified: {
        Value: isVerified,
        Action: 'PUT'
      },
      stripeConnectToken: {
        Action: 'DELETE'
      }
    },
    ReturnValues: 'ALL_NEW'
  };

  console.log(
    `Update the company with ID: ${company.companyId} with the connected Stripe account: ${stripeUserId}`
  );

  try {
    await dynamoDbLib.call('update', updateParams);

    console.log(
      'Successfully update the company with Stripe account ID, company name and company description'
    );

    return redirect(env.APPLICATION_URL);
  } catch (e) {
    console.error(e);
    return failure({ status: false });
  }
};

const removeStripeConnectToken = async companyId => {
  const params = {
    TableName: env.COMPANIES_TABLE_NAME,
    Key: {
      companyId
    },
    AttributeUpdates: {
      stripeConnectToken: {
        Action: 'DELETE'
      }
    },
    ReturnValues: 'ALL_NEW'
  };

  console.log('Remove the temporary token from the database');

  try {
    await dynamoDbLib.call('update', params);
    console.log('Temporary token successfully removed');
  } catch (e) {
    console.error(e);
  }
};
