import { ReactiveAggregate } from 'meteor/tunguska:reactive-aggregate'
import Timecards from '../timecards.js'
import Projects from '../../projects/projects.js'
import { periodToDates } from '../../../utils/periodHelpers.js'
import { checkAuthentication, getProjectListById } from '../../../utils/server_method_helpers.js'

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
        _id: '$task',
        entries: { $push: '$$ROOT' },
      },
    },
  ], { clientCollection: 'clientTimecards' })
})
Meteor.publish('myTimecardsForDate', function myTimecardsForDate({ date }) {
  check(date, String)
  checkAuthentication(this)
  return Timecards.find({
    userId: this.userId,
    date: new Date(date),
  })
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
