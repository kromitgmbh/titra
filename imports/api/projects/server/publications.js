import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import isBetween from 'dayjs/plugin/isBetween'
import { check } from 'meteor/check'
import Projects from '../projects'
import Timecards from '../../timecards/timecards.js'
import { checkAuthentication } from '../../../utils/server_method_helpers.js'

Meteor.publish('myprojects', function myProjects({ projectLimit }) {
  checkAuthentication(this)
  check(projectLimit, Match.Maybe(Number))
  return projectLimit ? Projects.find({
    $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
  }, { projectLimit }) : Projects.find({
    $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
  })
})
Meteor.publish('singleProject', function singleProject(projectId) {
  check(projectId, String)
  checkAuthentication(this)
  return Projects.find({
    $or: [{ userId: this.userId },
      { public: true },
      { team: this.userId }],
    _id: projectId,
  })
})

Meteor.publish('projectStats', function projectStats(projectId) {
  check(projectId, String)
  checkAuthentication(this)
  dayjs.extend(utc)
  dayjs.extend(isBetween)
  if (!this.userId || !Projects.findOne({
    _id: projectId,
    $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
  })) {
    return this.ready()
  }
  let initializing = true
  const currentMonthName = dayjs.utc().format('MMM')
  const currentMonthStart = dayjs.utc().startOf('month').toDate()
  const currentMonthEnd = dayjs.utc().endOf('month').toDate()
  const previousMonthName = dayjs.utc().subtract('1', 'month').format('MMM')
  const previousMonthStart = dayjs.utc().subtract('1', 'month').startOf('month').toDate()
  const previousMonthEnd = dayjs.utc().subtract('1', 'month').endOf('month').toDate()
  const beforePreviousMonthStart = dayjs.utc().subtract('2', 'month').startOf('month').toDate()
  const beforePreviousMonthEnd = dayjs.utc().subtract('2', 'month').endOf('month')
  const beforePreviousMonthName = dayjs.utc().subtract('2', 'month').format('MMM')

  let totalHours = 0
  let currentMonthHours = 0
  let previousMonthHours = 0
  let beforePreviousMonthHours = 0
  totalHours = Number.parseFloat(Promise.await(Timecards.rawCollection().aggregate([{
    $match: { projectId },
  }, {
    $group: { _id: null, totalHours: { $sum: '$hours' } },
  }]).toArray())[0]?.totalHours)
  currentMonthHours = Number.parseFloat(Promise.await(Timecards.rawCollection().aggregate([{ $match: { projectId, date: { $gte: currentMonthStart, $lte: currentMonthEnd } } }, { $group: { _id: null, currentMonthHours: { $sum: '$hours' } } }]).toArray())[0]?.currentMonthHours)
  previousMonthHours = Number.parseFloat(Promise.await(Timecards.rawCollection().aggregate([{ $match: { projectId, date: { $gte: previousMonthStart, $lte: previousMonthEnd } } }, { $group: { _id: null, previousMonthHours: { $sum: '$hours' } } }]).toArray())[0]?.previousMonthHours)
  beforePreviousMonthHours = Number.parseFloat(Promise.await(Timecards.rawCollection().aggregate([{ $match: { projectId, date: { $gte: beforePreviousMonthStart, $lte: beforePreviousMonthStart } } }, { $group: { _id: null, beforePreviousMonthHours: { $sum: '$hours' } } }]).toArray())[0]?.beforePreviousMonthHours)
  // observeChanges only returns after the initial `added` callbacks
  // have run. Until then, we don't want to send a lot of
  // `self.changed()` messages - hence tracking the
  // `initializing` state.
  const handle = Timecards.find({ projectId, date: { $gte: beforePreviousMonthStart } })
    .observeChanges({
      added: (timecardId) => {
        if (!initializing) {
          const timecard = Timecards.findOne({ _id: timecardId })
          if (dayjs(new Date(timecard.date)).isBetween(currentMonthStart, currentMonthEnd)) {
            currentMonthHours += Number.parseFloat(timecard.hours)
          }
          if (dayjs(new Date(timecard.date)).isBetween(previousMonthStart, previousMonthEnd)) {
            previousMonthHours += Number.parseFloat(timecard.hours)
          }
          if (dayjs(new Date(timecard.date))
            .isBetween(beforePreviousMonthStart, beforePreviousMonthEnd)) {
            beforePreviousMonthHours += Number.parseFloat(timecard.hours)
          }
          totalHours += Number.parseFloat(timecard.hours)
          this.changed(
            'projectStats',
            projectId,
            {
              totalHours,
              currentMonthName,
              currentMonthHours,
              previousMonthHours,
              previousMonthName,
              beforePreviousMonthName,
              beforePreviousMonthHours,
            },
          )
        }
      },
      removed: (timecardId) => {
        if (!initializing) {
          const timecard = Timecards.findOne({ _id: timecardId })
          if (timecard) {
            if (dayjs(new Date(timecard.date)).isBetween(currentMonthStart, currentMonthEnd)) {
              currentMonthHours += Number.parseFloat(timecard.hours)
            }
            if (dayjs(new Date(timecard.date)).isBetween(previousMonthStart, previousMonthEnd)) {
              previousMonthHours += Number.parseFloat(timecard.hours)
            }
            if (dayjs(new Date(timecard.date))
              .isBetween(beforePreviousMonthStart, beforePreviousMonthEnd)) {
              beforePreviousMonthHours += Number.parseFloat(timecard.hours)
            }
            totalHours += Number.parseFloat(timecard.hours)
          }
          this.changed(
            'projectStats',
            projectId,
            {
              totalHours,
              currentMonthName,
              currentMonthHours,
              previousMonthHours,
              previousMonthName,
              beforePreviousMonthName,
              beforePreviousMonthHours,
            },
          )
        }
      },
      changed: (timecardId) => {
        if (!initializing) {
          const timecard = Timecards.findOne({ _id: timecardId })
          if (dayjs(new Date(timecard.date)).isBetween(currentMonthStart, currentMonthEnd)) {
            currentMonthHours += Number.parseFloat(timecard.hours)
          }
          if (dayjs(new Date(timecard.date)).isBetween(previousMonthStart, previousMonthEnd)) {
            previousMonthHours += Number.parseFloat(timecard.hours)
          }
          if (dayjs(new Date(timecard.date))
            .isBetween(beforePreviousMonthStart, beforePreviousMonthEnd)) {
            beforePreviousMonthHours += Number.parseFloat(timecard.hours)
          }
          totalHours += Number.parseFloat(timecard.hours)
          this.changed('projectStats', projectId, {
            totalHours,
            currentMonthName,
            currentMonthHours,
            previousMonthHours,
            previousMonthName,
            beforePreviousMonthName,
            beforePreviousMonthHours,
          })
        }
      },
    })
  // Instead, we'll send one `self.added()` message right after
  // observeChanges has returned, and mark the subscription as
  // ready.
  initializing = false
  this.added('projectStats', projectId, {
    totalHours,
    currentMonthName,
    currentMonthHours,
    previousMonthHours,
    previousMonthName,
    beforePreviousMonthName,
    beforePreviousMonthHours,
  })
  // Stop observing the cursor when client unsubs.
  // Stopping a subscription automatically takes
  // care of sending the client any removed messages.
  this.onStop(() => {
    handle.stop()
  })
  return this.ready()
})

Meteor.publish('publicProjectName', (_id) => {
  check(_id, String)
  return Projects.find({ _id }, { name: 1 })
})
