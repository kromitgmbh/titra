import { Mongo } from 'meteor/mongo'

const Tasks = new Mongo.Collection('tasks')
export { Tasks as default }
