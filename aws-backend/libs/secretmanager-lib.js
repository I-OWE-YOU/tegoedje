import AWS from 'aws-sdk';

export function getSecrets(secretName) {
  const region = 'eu-west-1';
  const client = new AWS.SecretsManager({
    region
  });

  return new Promise((resolve, reject) => {
    client.getSecretValue({ SecretId: secretName }, function(err, data) {
      if (err) {
        reject(err);
      } else {
        // Decrypts secret using the associated KMS CMK.
        // Depending on whether the secret is a string or binary, one of these fields will be populated.
        if ('SecretString' in data) {
          resolve(JSON.parse(data.SecretString));
        } else {
          let buff = new Buffer(data.SecretBinary, 'base64');
          resolve(buff.toString('ascii'));
        }
      }
    });
  });
}
