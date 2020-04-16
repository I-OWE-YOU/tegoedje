import { failure, success, validationError } from '../libs/response-lib';
import * as dynamoDbLib from '../libs/dynamodb-lib';
import { companySchema } from '../validation/companySchema';
import { flattenObject } from '../libs/utils-lib';
import { getEnvironment } from '../libs/utils-lib';
// eslint-disable-next-line no-unused-vars
import typings from '../../typings/company';

export const main = async event => {
  /** @type {string} companyId - UUID */
  const companyId = event.pathParameters.id;
  const userId = event.requestContext.authorizer.claims.sub;

  if (companyId !== userId) {
    return failure({ status: false });
  }
  /** @type {typings.Company} */
  const data = JSON.parse(event.body);

  let value = null;

  try {
    value = await companySchema('optional').validateAsync(data);
  } catch (e) {
    const errorMessages = e.details.map(detail => detail.message);
    return validationError(errorMessages);
  }

  const params = {
    TableName: getEnvironment().COMPANIES_TABLE_NAME,
    Key: {
      companyId
    },
    // 'UpdateExpression' defines the attributes to be updated
    // 'ExpressionAttributeValues' defines the value in the update expression
    UpdateExpression: generateUpdateExpression(value),
    ExpressionAttributeValues: generateExpressionAttributeValues(data),
    // 'ReturnValues' specifies if and how to return the item's attributes,
    // where ALL_NEW returns all attributes of the item after the update;
    // you can inspect 'result' below to see how it works with different settings
    ReturnValues: 'ALL_NEW'
  };

  try {
    await dynamoDbLib.call('update', params);
    return success({ status: true });
  } catch (e) {
    console.log(e);
    return failure({ status: false });
  }
};

/**
 * Generates the update expression from the provided data object
 *
 * @param {typings.CompanyFlatten} data
 * @returns {Object}
 * @example
 * 'SET :prop1 = prop1, :prop2 = prop2'
 */
const generateUpdateExpression = data => {
  let output = 'SET';
  const flatten = flattenObject(data);
  const arr = Object.keys(flatten).filter(v => flatten[v]);

  arr.forEach((value, index) => {
    const isLast = index === arr.length - 1;
    output += ` ${value} = :${value}${isLast ? '' : ','}`;
  });

  return output;
};

/**
 * Generates the expression attribute values from the provided object data
 *
 * @param {typings.CompanyFlatten} data
 * @returns {Object}
 * @example
 * {
 *   ':prop1' = <prop1_value>,
 *   ':prop2' = <prop2_value>
 * }
 */
const generateExpressionAttributeValues = data => {
  const output = {};
  const flatten = flattenObject(data);
  const arr = Object.keys(flatten).filter(v => flatten[v]);

  arr.forEach(value => {
    output[`:${value}`] = flatten[value];
  });

  return output;
};
