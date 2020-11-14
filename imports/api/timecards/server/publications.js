import { ReactiveAggregate } from 'meteor/tunguska:reactive-aggregate'
import Timecards from '../timecards.js'
import Projects from '../../projects/projects.js'
import { periodToDates } from '../../../utils/periodHelpers.js'
import { checkAuthentication, getProjectListById, buildDetailedTimeEntriesForPeriodSelector } from '../../../utils/server_method_helpers.js'

Meteor.publish('projectTimecards', function projectTimecards({ projectId, period, userId }) {
  check(projectId, String)
  check(period, String)
  check(userId, String)
  checkAuthentication(this)
  const projectList = getProjectListById(projectId)

  if (period && period !== 'all') {
    const { startDate, endDate } = periodToDates(period)
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
  }
  if (userId === 'all') {
    return Timecards.find({ projectId: { $in: projectList } })
  }
  return Timecards.find({ projectId: { $in: projectList }, userId })
})

Meteor.publish('periodTimecards', function periodTimecards({ startDate, endDate, userId }) {
  check(startDate, Date)
  check(endDate, Date)
  check(userId, String)
  checkAuthentication(this)
  const projectList = Projects.find(
    { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
    { $fields: { _id: 1 } },
  ).fetch().map((value) => value._id)

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
Meteor.publish('userTimeCardsForPeriodByProjectByTask', function periodTimecards({ projectId, startDate, endDate }) {
  check(startDate, Date)
  check(endDate, Date)
  check(projectId, String)
  checkAuthentication(this)
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
  ], { clientCollection: 'clientTimecards' })
})
Meteor.publish('myTimecardsForDate', function myTimecardsForDate({ date }) {
  check(date, String)
  checkAuthentication(this)
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
}) {
  check(projectId, String)
  check(userId, String)
  check(customer, String)
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
    projectId, search, customer, period, dates, userId,
  })
  const handle = Timecards.find(selector[0], selector[1]).observeChanges({
    added: () => {
      count += 1

      if (!initializing) {
        this.changed('counts', projectId, { count })
      }
    },
    removed: () => {
      count -= 1
      this.changed('counts', projectId, { count })
    },
  })

  initializing = false
  this.added('counts', projectId, { count })
  this.ready()

  this.onStop(() => handle.stop())
})

Meteor.publish('getDetailedTimeEntriesForPeriod', function getDetailedTimeEntriesForPeriod({
  projectId,
  userId,
  customer,
  period,
  dates,
  search,
  sort,
  limit,
  page,
}) {
  check(projectId, String)
  check(userId, String)
  check(customer, String)
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
  checkAuthentication(this)
  const selector = buildDetailedTimeEntriesForPeriodSelector({
    projectId, search, customer, period, dates, userId, limit, page, sort,
  })
  return Timecards.find(selector[0], selector[1])
})
Meteor.publish('singleTimecard', function singleTimecard(_id) {
  check(_id, String)
  checkAuthentication(this)
  const timecard = Timecards.findOne({ _id })
  const project = Projects.findOne({ _id: timecard.projectId })
  if (!this.userId || (!Timecards.findOne({ userId: this.userId }) && !project.public)) {
    return this.ready()
  }
  return Timecards.find({ _id })
})
