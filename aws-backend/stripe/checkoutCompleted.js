import Stripe from 'stripe';
import { v1 as uuidv1 } from 'uuid';

import { badRequest, failure, success } from '../libs/response-lib';
import * as dynamoDbLib from '../libs/dynamodb-lib';
import { getEnvironment } from '../libs/utils-lib';
// eslint-disable-next-line no-unused-vars
import typings from '../../typings/coupon';
import { sendCouponEmail } from '../email/send-coupon';
import * as secretManagerLib from '../libs/secretmanager-lib';

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
      stripeSecrets.WEBHOOK_CHECKOUT_COMPLETED_SECRET_KEY // We are getting this one from Stripe Dashboard, when a webhook is created
    );
  } catch (err) {
    console.error({ err, body: JSON.parse(event.body) });
    return badRequest(`Webhook Error: ${err.message}`);
  }

  if (webhookEvent.type === 'checkout.session.completed') {
    const session = webhookEvent.data.object;

    console.log('`checkout.session.completed` event received');

    try {
      /** @type {typings.Coupon} */
      const coupon = {
        couponId: uuidv1(),
        sessionId: session.id,
        customer: session.customer,
        customerEmail: session.customer_email,
        amount: session.display_items[0].amount,
        paymentIntent: session.payment_intent,
        companyId: session.metadata.companyId,
        createdAt: Date.now()
      };

      await handleCheckoutSession(session, coupon);

      try {
        await sendCouponEmail(coupon);
      } catch (e) {
        console.error('Error sending the email');
        console.error(e);
        return failure(e);
      }
    } catch (e) {
      console.error(e);
      return failure(e);
    }
  }

  return success({ received: true });
};

const handleCheckoutSession = async (session, coupon) => {
  console.log(`Process the session with ID: ${session.id}, and save it in DB`);
  const params = {
    TableName: env.COUPONS_TABLE_NAME,
    Item: coupon
  };

  try {
    await dynamoDbLib.call('put', params);
  } catch (e) {
    console.error(e);
    return failure(e);
  }
};
