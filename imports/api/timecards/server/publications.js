import { Match } from 'meteor/check'
import Timecards from '../timecards.js'
import Projects from '../../projects/projects.js'
import { checkAuthentication, buildDetailedTimeEntriesForPeriodSelectorAsync } from '../../../utils/server_method_helpers.js'

/**
   * Publishes the project list based on the provided period.
   *
   * @name periodTimecards
   * @param {Object} this - The context of the current publication.
   * @param {Date} startDate - The start date of the timecards.
   * @param {Date} endDate - The end date of the timecards.
   * @returns {Array} - The list of projects that match the period.
   */
Meteor.publish('periodTimecards', async function periodTimecards({ startDate, endDate, userId }) {
  check(startDate, Date)
  check(endDate, Date)
  check(userId, String)
  await checkAuthentication(this)
  let projectList = await Projects.find(
    {
      $and: [
        { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
        { $or: [{ archived: false }, { archived: { $exists: false } }] },
      ],
    },
    { fields: { _id: 1 } },
  ).fetchAsync()
  projectList = projectList.map((value) => value._id)

  if (userId === 'all') {
    return Timecards.find({
      projectId: { $in: projectList },
      date: { $gte: startDate, $lte: endDate },
    })
  }
  return Timecards.find({
    projectId: { $in: projectList },
    userId,
    date: { $gte: startDate, $lte: endDate },
  })
})
/**
 * Publishes timecards based on the provided start date.
 *
 * @param {Date} date - The start date for filtering timecards.
 */
Meteor.publish('myTimecardsForDate', async function myTimecardsForDate({ date }) {
  check(date, String)
  await checkAuthentication(this)
  const startDate = new Date(date)
  const endDate = new Date(date)
  startDate.setHours(0)
  endDate.setHours(23, 59)
  return Timecards.find({
    userId: this.userId,
    date: { $gte: startDate, $lte: endDate },
  })
})
/**
 * Publishes the counts of time entries for the provided period.
 * @name getDetailedTimeEntriesForPeriodCount
 * @param {string} projectId - The ID of the project.
 * @param {string} userId - The ID of the user.
 * @param {string} customer - The ID of the customer.
 * @param {string} period - The period to filter the time entries.
 * @param {Object} dates - The start and end dates for the custom period.
 * @param {string} search - The search string.
 * @param {Object} filters - The filters to apply.
 * @returns {number} - The number of time entries that match the period.
 */
Meteor.publish('getDetailedTimeEntriesForPeriodCount', async function getDetailedTimeEntriesForPeriodCount({
  projectId,
  userId,
  customer,
  period,
  dates,
  search,
  filters,
}) {
  check(projectId, Match.OneOf(String, Array))
  check(userId, Match.OneOf(String, Array))
  check(customer, Match.OneOf(String, Array))
  check(period, String)
  if (period === 'custom') {
    check(dates, Object)
    check(dates.startDate, Date)
    check(dates.endDate, Date)
  }
  check(search, Match.Maybe(String))
  let count = 0
  let initializing = true
  const selector = await buildDetailedTimeEntriesForPeriodSelectorAsync({
    projectId, search, customer, period, dates, userId, filters,
  })
  const countsId = projectId instanceof Array ? projectId.join('') : projectId
  const handle = await Timecards.find(selector[0], selector[1]).observeChangesAsync({
    added: () => {
      count += 1

      if (!initializing) {
        this.changed('counts', countsId, { count })
      }
    },
    removed: () => {
      count -= 1
      this.changed('counts', countsId, { count })
    },
  })

  initializing = false
  this.added('counts', countsId, { count })
  this.ready()

  this.onStop(() => handle.stop())
})
/**
 * Publishes time entries for the provided period.
 * @name getDetailedTimeEntriesForPeriod
 * @param {string} projectId - The ID of the project.
 * @param {string} userId - The ID of the user.
 * @param {string} customer - The ID of the customer.
 * @param {string} period - The period to filter the time entries.
 * @param {Object} dates - The start and end dates for the custom period.
 * @param {string} search - The search string.
 * @param {Object} sort - The sort object.
 * @param {number} limit - The number of time entries to return.
 * @param {number} page - The page number.
 * @param {Object} filters - The filters to apply.
 * @returns {Array} - The list of time entries that match the period.
 */
Meteor.publish('getDetailedTimeEntriesForPeriod', async function getDetailedTimeEntriesForPeriod({
  projectId,
  userId,
  customer,
  period,
  dates,
  search,
  sort,
  limit,
  page,
  filters,
}) {
  check(projectId, Match.OneOf(String, Array))
  check(userId, Match.OneOf(String, Array))
  check(customer, Match.OneOf(String, Array))
  check(period, String)
  check(search, Match.Maybe(String))
  check(sort, Match.Maybe(Object))
  if (period === 'custom') {
    check(dates, Object)
    check(dates.startDate, Date)
    check(dates.endDate, Date)
  }
  if (sort) {
    check(sort.column, Number)
    check(sort.order, String)
  }
  check(limit, Number)
  check(page, Match.Maybe(Number))
  check(filters, Match.Maybe(Object))
  await checkAuthentication(this)
  const selector = await buildDetailedTimeEntriesForPeriodSelectorAsync({
    projectId, search, customer, period, dates, userId, limit, page, sort, filters,
  })
  return Timecards.find(selector[0], selector[1])
})
/**
 * Publishes a single timecard based on the provided ID.
 * @name singleTimecard
 * @param {string} _id - The ID of the timecard.
 */
Meteor.publish('singleTimecard', async function singleTimecard(_id) {
  check(_id, String)
  await checkAuthentication(this)
  const timecard = await Timecards.findOneAsync({ _id })
  const project = await Projects.findOneAsync({ _id: timecard.projectId })
  if (!this.userId || (!await Timecards.findOneAsync({ userId: this.userId }) && !project.public)) {
    return this.ready()
  }
  return Timecards.find({ _id })
})
