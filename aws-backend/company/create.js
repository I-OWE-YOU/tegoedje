import * as dynamoDbLib from '../libs/dynamodb-lib';
import { getEnvironment } from '../libs/utils-lib';
import { companySchema } from '../validation/companySchema';
import { validationError } from '../libs/response-lib';


export const main = async event => {
  const { sub, email } = event.request.userAttributes;
  const testValues = { companyId: sub, email: email };

  try {
    await companySchema('optional').validateAsync(testValues);
  } catch (e) {
    const errorMessages = e.details.map(detail => detail.message);
    return validationError(errorMessages);
  }

  const params = {
    TableName: getEnvironment().COMPANIES_TABLE_NAME,
    Item: {
      companyId: sub,
      userId: sub,
      email: email,
      acceptedTerms: true
    }
  };

  try {
    await dynamoDbLib.call('put', params);
  } catch (e) {
    console.error(e);
  }
  return event;
};
