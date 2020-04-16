import { sendCouponEmail } from './send-coupon';
// eslint-disable-next-line no-unused-vars
import typings from '../../typings/coupon';
import { noContent, failure } from '../libs/response-lib';

// DEV ONLY!
// This lambda is for testing purpose only and not supposed to be deployed in prod
export async function main() {
    try {

        /** @type {typings.Coupon} */
        const coupon = {
            couponId: 'couponId',
            amount: 20,
            companyId: 'f5a24ad0-7360-11ea-a3f7-5d7cd1978569',
            customerEmail: 'iafanasov@mobiquityinc.com'
        };

        await sendCouponEmail(coupon);

    } catch (error) {
        console.error(error);
        return failure(error);
    }

    return noContent();
};