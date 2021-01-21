import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const todoTable = process.env.TODO_TABLE;
const bucketName = process.env.TODO_ATTACHMENTS_S3_BUCKET_NAME;
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION);

const docClient = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3({ signatureVersion: 'v4' });

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  const uploadUrl = await s3.getSignedUrlPromise('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  });

  await docClient.update({
    TableName: todoTable,
    Key: {
      "todoId": todoId
    },
    UpdateExpression: "set attachmentUrl = :attachmentUrl",
    ExpressionAttributeValues: {
      ":attachmentUrl": `https://${bucketName}.s3.amazonaws.com/${todoId}`,
    }
  }).promise()

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      uploadUrl
    })
  };
}
