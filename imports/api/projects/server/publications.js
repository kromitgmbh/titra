import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import isBetween from 'dayjs/plugin/isBetween'
import { check } from 'meteor/check'
import Projects from '../projects'
import Timecards from '../../timecards/timecards.js'
import { checkAuthentication } from '../../../utils/server_method_helpers.js'

Meteor.publish('myprojects', function myProjects() {
  checkAuthentication(this)
  return Projects.find({
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

Meteor.publish('myProjectStats', function myProjectStats() {
  checkAuthentication(this)
  dayjs.extend(utc)
  dayjs.extend(isBetween)
  let initializing = true

  const currentMonthStart = dayjs.utc().startOf('month')
  const currentMonthEnd = dayjs.utc().endOf('month')
  const previousMonthStart = dayjs.utc().startOf('month')
  const previousMonthEnd = dayjs.utc().endOf('month')
  // observeChanges only returns after the initial `added` callbacks
  // have run. Until then, we don't want to send a lot of
  // `self.changed()` messages - hence tracking the
  // `initializing` state.
  const handle = Projects.find({
    $or: [{ userId: this.userId },
      { public: true }, { team: this.userId }],
  }).observeChanges({
    added: (projectId) => {
      if (!initializing) {
        let totalHours = 0
        let currentMonthHours = 0
        let previousMonthHours = 0
        for (const timecard of
          Timecards.find({ userId: this.userId, projectId }).fetch()) {
          if (dayjs(new Date(timecard.date)).isBetween(currentMonthStart, currentMonthEnd)) {
            currentMonthHours += Number.parseFloat(timecard.hours)
          }
          if (dayjs(new Date(timecard.date)).isBetween(previousMonthStart, previousMonthEnd)) {
            previousMonthHours += Number.parseFloat(timecard.hours)
          }
          totalHours += Number.parseFloat(timecard.hours)
        }
        this.changed('projectStats', projectId, { totalHours, currentMonthHours, previousMonthHours })
      }
    },
    removed: (projectId) => {
      let totalHours = 0
      let currentMonthHours = 0
      let previousMonthHours = 0
      for (const timecard of
        Timecards.find({ userId: this.userId, projectId }).fetch()) {
        if (dayjs(new Date(timecard.date)).isBetween(currentMonthStart, currentMonthEnd)) {
          currentMonthHours += Number.parseFloat(timecard.hours)
        }
        if (dayjs(new Date(timecard.date)).isBetween(previousMonthStart, previousMonthEnd)) {
          previousMonthHours += Number.parseFloat(timecard.hours)
        }
        totalHours += Number.parseFloat(timecard.hours)
      }
      this.changed('projectStats', projectId, { totalHours, currentMonthHours, previousMonthHours })
    },
    changed: (projectId) => {
      let totalHours = 0
      let currentMonthHours = 0
      let previousMonthHours = 0
      for (const timecard of
        Timecards.find({ userId: this.userId, projectId }).fetch()) {
        if (dayjs(new Date(timecard.date)).isBetween(currentMonthStart, currentMonthEnd)) {
          currentMonthHours += Number.parseFloat(timecard.hours)
        }
        if (dayjs(new Date(timecard.date)).isBetween(previousMonthStart, previousMonthEnd)) {
          previousMonthHours += Number.parseFloat(timecard.hours)
        }
        totalHours += Number.parseFloat(timecard.hours)
      }
      this.changed('projectStats', projectId, { totalHours, currentMonthHours, previousMonthHours })
    },
  })
  // Instead, we'll send one `self.added()` message right after
  // observeChanges has returned, and mark the subscription as
  // ready.
  initializing = false
  for (const project of Projects.find({
    $or: [{ userId: this.userId },
      { public: true }, { team: this.userId }],
  }).fetch()) {
    let totalHours = 0
    let currentMonthHours = 0
    let previousMonthHours = 0
    for (const timecard of
      Timecards.find({ userId: this.userId, projectId: project._id }).fetch()) {
      if (dayjs(new Date(timecard.date)).isBetween(currentMonthStart, currentMonthEnd)) {
        currentMonthHours += Number.parseFloat(timecard.hours)
      }
      if (dayjs(new Date(timecard.date)).isBetween(previousMonthStart, previousMonthEnd)) {
        previousMonthHours += Number.parseFloat(timecard.hours)
      }
      totalHours += Number.parseFloat(timecard.hours)
    }
    this.added('projectStats', project._id, { totalHours, currentMonthHours, previousMonthHours })
  }
  this.ready()
  // Stop observing the cursor when client unsubs.
  // Stopping a subscription automatically takes
  // care of sending the client any removed messages.
  this.onStop(() => {
    handle.stop()
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
  const currentMonthStart = dayjs.utc().startOf('month')
  const currentMonthEnd = dayjs.utc().endOf('month')
  const previousMonthName = dayjs.utc().subtract('1', 'month').format('MMM')
  const previousMonthStart = dayjs.utc().subtract('1', 'month').startOf('month')
  const previousMonthEnd = dayjs.utc().subtract('1', 'month').endOf('month')
  const beforePreviousMonthStart = dayjs.utc().subtract('2', 'month').startOf('month')
  const beforePreviousMonthEnd = dayjs.utc().subtract('2', 'month').endOf('month')
  const beforePreviousMonthName = dayjs.utc().subtract('2', 'month').format('MMM')

  let totalHours = 0
  let currentMonthHours = 0
  let previousMonthHours = 0
  let beforePreviousMonthHours = 0

  // observeChanges only returns after the initial `added` callbacks
  // have run. Until then, we don't want to send a lot of
  // `self.changed()` messages - hence tracking the
  // `initializing` state.
  const handle = Timecards.find({ projectId }).observeChanges({
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
        this.changed('projectStats', projectId,
          {
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
    removed: (timecardId) => {
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
        this.changed('projectStats', projectId,
          {
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
  for (const timecard of
    Timecards.find({ projectId }).fetch()) {
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
