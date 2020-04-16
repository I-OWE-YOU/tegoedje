import { failure, resourceNotFound, success } from '../libs/response-lib';
import * as dynamoDbLib from '../libs/dynamodb-lib';
import { getEnvironment } from '../libs/utils-lib';
// eslint-disable-next-line no-unused-vars
import typings from '../../typings/company';

export const main = async event => {
  /** @type {string} id - UUID */
  const companyId = event.pathParameters.id;

  try {
    const company = await getCompany(companyId);

    if (company) {
      return success(company);
    } else {
      return resourceNotFound({ status: false, error: 'Item not found!' });
    }
  } catch (e) {
    console.error(e);
    return failure({ status: false });
  }
};

/**
 * @param {string} companyId
 * @return {typings.Company}
 */
export async function getCompany(companyId) {
  const params = {
    TableName: getEnvironment().COMPANIES_TABLE_NAME,
    Key: {
      companyId
    },
    ProjectionExpression:
      'companyId, companyName, city, longitude, latitude, houseNumber, zipCode, street, companyDescription, stripeUserId'
  };

  const result = await dynamoDbLib.call('get', params);

  return result.Item;
}
