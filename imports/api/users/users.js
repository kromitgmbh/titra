import { Mongo } from 'meteor/mongo'

const projectUsers = new Mongo.Collection('projectUsers')
const projectResources = new Mongo.Collection('projectResources')
export { projectUsers, projectResources }
