import axios from 'axios';
import { failure, success, validationError } from '../libs/response-lib';
import { getEnvironment } from '../libs/utils-lib';
//eslint-disable-next-line no-unused-vars
import { addressRequestSchema, AddressRequestParams } from '../validation/addressRequestSchema';
//eslint-disable-next-line no-unused-vars
import typings from '../../typings/address';

export const main = async event => {

  /** @type {AddressRequestParams} */
  let pathParams;
  try {
    pathParams = await addressRequestSchema.validateAsync(event.pathParameters);
  } catch (e) {
    const errorMessages = e.details.map(detail => detail.message);
    return validationError(errorMessages);
  }
  const { postalCode, houseNumber } = pathParams;

  const env = getEnvironment();
  const geocodeEndpoint = env.GEOCODE_ENDPOINT;
  const apiKey = env.GEOCODE_API_KEY;
  const region = env.GEOCODE_REGION;

  try {
    const response = await axios.get(geocodeEndpoint, {
      params: {
        auth: apiKey,
        locate: postalCode,
        stnumber: houseNumber,
        region: region,
        json: '1'
      }
    });

    /** @type {typings.Address} */
    const data = response.data;

    if (data.error) {
      return failure(data.error);
    }

    const address = {
      city: data.standard.city,
      houseNumber: houseNumber,
      latitude: data.latt,
      longitude: data.longt,
      street: data.alt.loc.streets.street_address.staddress,
      zipCode: postalCode
    };

    return success(address);
  } catch (e) {
    console.error(e);
    return failure('There has been an error');
  }
};
