import { failure, success, validationError } from '../libs/response-lib';
import * as dynamoDbLib from '../libs/dynamodb-lib';
import { getEnvironment } from '../libs/utils-lib';
import { companySchema } from '../validation/companySchema';

export const main = async event => {
  /** @type {string} companyId - UUID */
  const companyId = event.pathParameters.id;
  const userId = event.requestContext.authorizer.claims.sub;

  const testValues = { companyId, userId };

  try {
    await companySchema('optional').validateAsync(testValues);
  } catch (e) {
    const errorMessages = e.details.map(detail => detail.message);
    return validationError(errorMessages);
  }

  if (companyId !== userId) {
    return failure({ status: false });
  }

  const params = {
    TableName: getEnvironment().COMPANIES_TABLE_NAME,
    Key: {
      companyId
    }
  };

  try {
    await dynamoDbLib.call('delete', params);
    return success({ status: true });
  } catch (e) {
    console.error(e);
    return failure({ status: false });
  }
};
