import { failure, success } from '../libs/response-lib';
import * as dynamoDbLib from '../libs/dynamodb-lib';
import { getEnvironment } from '../libs/utils-lib';

export const main = async () => {
  const params = {
    TableName: getEnvironment().COMPANIES_TABLE_NAME,
    ProjectionExpression:
      'companyId, companyName, city, houseNumber,longitude, latitude, zipCode, street, isVerified, companyDescription, stripeUserId'
  };

  let companies = [];
  let items;

  try {
    do {
      items = await dynamoDbLib.call('scan', params);
      items.Items.forEach(item => {
        if (item.stripeUserId) {
          // extract stripeUserId since we don't need this in response
          //eslint-disable-next-line no-unused-vars
          const { stripeUserId, ...rest } = item;
          companies.push(rest);
        }
      });
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != 'undefined');

    return success(companies);
  } catch (e) {
    console.error(e);
    return failure({ status: false });
  }
};