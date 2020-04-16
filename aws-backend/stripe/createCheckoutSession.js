import Stripe from 'stripe';
import AWS from 'aws-sdk';

import { failure, resourceNotFound, success, validationError } from '../libs/response-lib';
import * as secretManagerLib from '../libs/secretmanager-lib';
import { getEnvironment } from '../libs/utils-lib';
import { couponCheckoutRequestSchema } from '../validation/couponCheckoutRequestSchema';
// eslint-disable-next-line no-unused-vars
import typings from '../../typings/stripeSecrets';

const env = getEnvironment();

export const main = async event => {

  /** @type {CheckoutSessionRequestParams} */
  let qsParams;
  try {
    qsParams = await couponCheckoutRequestSchema.validateAsync(event.queryStringParameters);
  } catch (e) {
    const errorMessages = e.details.map(detail => detail.message);
    return validationError(errorMessages);
  }

  const { amount, companyId, customerEmail } = qsParams;

  const dynamoDb = new AWS.DynamoDB.DocumentClient();

  /** @type {AWS.DynamoDB.DocumentClient.GetItemInput} */
  const params = {
    TableName: env.COMPANIES_TABLE_NAME,
    Key: {
      companyId
    },
    ProjectionExpression: 'stripeUserId, companyName'
  };

  console.log(`Get the company with ID: ${companyId}`);
  let stripeUserId;
  let companyName;
  try {
    const result = await dynamoDb.get(params).promise();

    if (result.Item) {
      stripeUserId = result.Item.stripeUserId;
      companyName = result.Item.companyName;
    } else {
      console.warn(`Company with ID "${companyId}" not found`);
      return resourceNotFound({ status: false, error: 'Company not found!' });
    }
  } catch (e) {
    console.error(e);
    return failure({ status: false });
  }

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
  /** @type {Stripe} */
  const stripe = Stripe(stripeSecrets.API_SECRET_KEY);

  console.log('Create a payment checkout session with Stripe');
  /** @type {Stripe.Checkout.Session} */
  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card', 'ideal'],
        line_items: [
          {
            name: 'Coupon',
            amount,
            currency: 'eur',
            quantity: 1
          }
        ],
        customer_email: customerEmail,
        success_url: `${env.STRIPE_CHECKOUT_REDIRECT_SUCCESS}?session_id={CHECKOUT_SESSION_ID}&company_name=${companyName}`,
        cancel_url: env.STRIPE_CHECKOUT_REDIRECT_CANCEL,
        metadata: {
          companyId
        }
      },
      {
        stripeAccount: stripeUserId
      }
    );

    console.log('Stripe checkout session successfully created');
  } catch (e) {
    console.error(e);
    return failure({ status: false });
  }

  return success(session);
};
