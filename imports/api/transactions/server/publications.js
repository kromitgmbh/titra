import { check, Match } from 'meteor/check'
import Transactions from '../transactions.js'
import { checkAdminAuthentication } from '../../../utils/server_method_helpers'

/**
 * Publishes all transactions.
 * @param {Number} limit - The number of transactions to return.
 * @param {String} filter - The string to filter transactions by.
 * @returns {Array} - The list of transactions that match the filter.
 */
Meteor.publish('allTransactions', async function allTransactions({ limit, filter }) {
  check(limit, Match.Maybe(Number))
  check(filter, Match.Maybe(String))
  await checkAdminAuthentication(this)
  const selector = {}
  if (filter) {
    selector.$or = [
      { user: { $regex: filter, $options: 'i' } },
      { method: { $regex: filter, $options: 'i' } },
      { args: { $regex: filter, $options: 'i' } },
    ]
  }
  return Transactions.find(selector, { limit: limit || 25, sort: { timestamp: -1 } })
})
