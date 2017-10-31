import { Mongo } from 'meteor/mongo'

const Dashboards = new Mongo.Collection('dashboards')
const dashboardAggregation = new Mongo.Collection('dashboardAggregation')

export { dashboardAggregation, Dashboards }
