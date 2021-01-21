import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import * as AWS from 'aws-sdk'
import { getUserId } from '../utils'
import { v4 as uuid } from 'uuid';
import { TodoItem } from '../../models/TodoItem'

const todoTable = process.env.TODO_TABLE;
const docClient = new AWS.DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  const todo: TodoItem = {
    ...newTodo,
    userId: getUserId(event),
    todoId: uuid(),
    createdAt: new Date().toISOString(),
    done: false
  };

  await docClient.put({
    TableName: todoTable,
    Item: todo
  }).promise()

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item: todo
    })
  };
}
