import { Mongo } from 'meteor/mongo'

const Transactions = new Mongo.Collection('transactions')

export default Transactions
