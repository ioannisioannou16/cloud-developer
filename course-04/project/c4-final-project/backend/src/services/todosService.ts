import { TodosDao } from '../dao/todosDao'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { TodoItem } from '../models/TodoItem'
import { v4 as uuid } from 'uuid'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'

const todosDao = new TodosDao()
const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({ signatureVersion: 'v4' })
const logger = createLogger("todosService")

const bucketName = process.env.TODO_ATTACHMENTS_S3_BUCKET_NAME
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)

export async function createTodo(
  userId: string,
  createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {
  const todoId = uuid();
  logger.info('Creating todo', { userId, todoId })
  const todo: TodoItem = {
    ...createTodoRequest,
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false
  }
  await todosDao.createTodo(todo)
  logger.info('Successfully created new todo', { userId, todoId })
  return todo
}

export async function getTodos(userId: string): Promise<TodoItem[]> {
  logger.info('Getting todos', { userId })
  const todos = todosDao.getTodos(userId)
  logger.info('Successfully got todos', { userId })
  return todos;
}

export async function generateTodoUploadUrl(todoId: string): Promise<string> {
  logger.info('Generating an upload url', { todoId })
  const uploadUrl = await s3.getSignedUrlPromise('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })
  const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${todoId}`
  await todosDao.updateTodoAttachmentUrl(todoId, attachmentUrl)
  logger.info('Successfully generated upload url and updated todo', { todoId })
  return uploadUrl
}

export async function updateTodo(
  todoId: string,
  updatedTodo: UpdateTodoRequest
): Promise<void> {
  logger.info('Updating todo', { todoId })
  await todosDao.updateTodo(todoId, updatedTodo)
  logger.info('Successfully updated todo', { todoId })
}

export async function deleteTodo(todoId: string): Promise<void> {
  logger.info('Deleting todo', { todoId })
  await todosDao.deleteTodo(todoId)
  logger.info('Successfully deleted todo', { todoId })
}
