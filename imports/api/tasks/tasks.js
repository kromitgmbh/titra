import { Mongo } from 'meteor/mongo'

const Tasks = new Mongo.Collection('tasks')
const TopTasks = new Mongo.Collection('toptasks')
export { TopTasks, Tasks as default }
