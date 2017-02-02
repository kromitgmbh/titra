import { Mongo } from 'meteor/mongo'

const Timecards = new Mongo.Collection('timecards')
export { Timecards as default }
