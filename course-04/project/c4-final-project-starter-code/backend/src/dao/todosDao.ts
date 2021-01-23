import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS)

export class TodosDao {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todoTable: string = process.env.TODO_TABLE,
    private readonly todoUserIndex: string = process.env.TODO_USER_INDEX) {
  }

  async createTodo(todo: TodoItem): Promise<void> {
    await this.docClient.put({
      TableName: this.todoTable,
      Item: todo
    }).promise()
  }

  async getTodos(userId: string): Promise<TodoItem[]> {
    const result = await this.docClient.query({
      TableName: this.todoTable,
      IndexName: this.todoUserIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
    }).promise()
    return result.Items as TodoItem[]
  }

  async updateTodo(todoId: string, updatedTodo: UpdateTodoRequest): Promise<void> {
    await this.docClient.update({
      TableName: this.todoTable,
      Key: {
        "todoId": todoId
      },
      UpdateExpression: "set #todoName = :name, dueDate = :dueDate, done = :done",
      ExpressionAttributeNames: {
        "#todoName": "name"
      },
      ExpressionAttributeValues: {
        ":name": updatedTodo.name,
        ":dueDate": updatedTodo.dueDate,
        ":done": updatedTodo.done
      }
    }).promise()
  }

  async updateTodoAttachmentUrl(todoId: string, attachmentUrl: string): Promise<void> {
    await this.docClient.update({
      TableName: this.todoTable,
      Key: {
        "todoId": todoId
      },
      UpdateExpression: "set attachmentUrl = :attachmentUrl",
      ExpressionAttributeValues: {
        ":attachmentUrl": attachmentUrl,
      }
    }).promise()
  }

  async deleteTodo(todoId: string): Promise<void> {
    await this.docClient.delete({
      TableName: this.todoTable,
      Key: {
        todoId
      }
    }).promise()
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }
  return new XAWS.DynamoDB.DocumentClient()
}
