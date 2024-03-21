import { ReactiveAggregate } from 'meteor/tunguska:reactive-aggregate'
import { Match } from 'meteor/check'
import Timecards from '../timecards.js'
import Projects from '../../projects/projects.js'
import { checkAuthentication, buildDetailedTimeEntriesForPeriodSelector } from '../../../utils/server_method_helpers.js'

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
Meteor.publish('userTimeCardsForPeriodByProjectByTask', async function periodTimecards({ projectId, startDate, endDate }) {
  check(startDate, Date)
  check(endDate, Date)
  check(projectId, String)
  await checkAuthentication(this)
  return ReactiveAggregate(this, Timecards, [
    {
      $match: {
        projectId,
        userId: this.userId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $concat: ['$projectId', '|', '$task'] },
        entries: { $push: '$$ROOT' },
      },
    },
  ], { clientCollection: 'clientTimecards', specificWarnings: { objectId: false } })
})
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
Meteor.publish('getDetailedTimeEntriesForPeriodCount', function getDetailedTimeEntriesForPeriodCount({
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
  const selector = buildDetailedTimeEntriesForPeriodSelector({
    projectId, search, customer, period, dates, userId, filters,
  })
  const countsId = projectId instanceof Array ? projectId.join('') : projectId
  const handle = Timecards.find(selector[0], selector[1]).observeChanges({
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
  const selector = buildDetailedTimeEntriesForPeriodSelector({
    projectId, search, customer, period, dates, userId, limit, page, sort, filters,
  })
  return Timecards.find(selector[0], selector[1])
})

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
