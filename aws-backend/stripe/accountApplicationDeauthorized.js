import Stripe from 'stripe';

import { badRequest, failure, success } from '../libs/response-lib';
import { getEnvironment } from '../libs/utils-lib';
import * as secretManagerLib from '../libs/secretmanager-lib';
import * as dynamoDbLib from '../libs/dynamodb-lib';

const env = getEnvironment();
export const main = async event => {
  const stripeSignature = event.headers['Stripe-Signature'];

  const secretName = `${env.STAGE}/stripe`;
  let stripeSecrets;
  try {
    console.log(`Get secret with name ${secretName}`);
    stripeSecrets = await secretManagerLib.getSecrets(secretName);
  } catch (e) {
    console.error(e);
    return failure({ status: false });
  }

  const stripe = Stripe(stripeSecrets.API_SECRET_KEY);

  console.log('Request:', JSON.stringify(event));

  let webhookEvent;

  console.log('Verify the event with Stripe');
  try {
    webhookEvent = stripe.webhooks.constructEvent(
      event.body,
      stripeSignature,
      stripeSecrets.WEBHOOK_ACCOUNT_APP_DEAUTHORIZED_KEY // We are getting this one from Stripe Dashboard, when a webhook is created
    );
  } catch (err) {
    console.error({ err, body: JSON.parse(event.body) });
    return badRequest(`Webhook Error: ${err.message}`);
  }

  if (webhookEvent.type === 'account.application.deauthorized') {
    const stripeUserId = webhookEvent.account;

    console.log({ webhookEvent: JSON.stringify(webhookEvent) });

    try {
      console.log(`De-authorize account with ID ${stripeUserId}`);
      await stripe.oauth.deauthorize({
        client_id: stripeSecrets.API_CLIENT_ID,
        stripe_user_id: stripeUserId
      });

      await removeStripeConnection(stripeUserId);
    } catch (e) {
      console.error(e);
      return failure({ status: false });
    }
  }

  return success({ status: true });
};

/**
 * Remove the stripe connection from all companies
 * @param stripeUserId
 * @returns {Promise<void>}
 */
async function removeStripeConnection(stripeUserId) {
  const params = {
    TableName: env.COMPANIES_TABLE_NAME,
    ExpressionAttributeValues: {
      ':stripeUserId': stripeUserId
    },
    FilterExpression: 'stripeUserId = :stripeUserId'
  };

  console.log(`Remove stripe connection from the companies`);

  try {
    const companies = await dynamoDbLib.call('scan', params);

    for (let i = 0; i < companies.Count; i++) {
      const company = companies.Items[i];
      await updateCompany(company);
    }
  } catch (e) {
    throw new Error(e);
  }
}

/**
 * Update the company, by removing the stripeUserId
 * @param company
 * @returns {Promise<void>}
 */
async function updateCompany(company) {
  const params = {
    TableName: getEnvironment().COMPANIES_TABLE_NAME,
    Key: {
      companyId: company.companyId
    },
    AttributeUpdates: {
      stripeUserId: {
        Action: 'DELETE'
      }
    },
    ReturnValues: 'ALL_NEW'
  };

  console.log(`Remove stripeUserId from company with ID: ${company.companyId}`);

  try {
    await dynamoDbLib.call('update', params);
  } catch (e) {
    throw new Error(e);
  }
}
