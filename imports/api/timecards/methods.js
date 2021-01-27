import dayjs from 'dayjs'
import i18next from 'i18next'
import { NodeVM } from 'vm2'
import fetch from 'node-fetch'
import { check, Match } from 'meteor/check'
import { Promise } from 'meteor/promise'
import Timecards from './timecards.js'
import Tasks from '../tasks/tasks.js'
import Projects from '../projects/projects.js'
import { emojify, getGlobalSetting } from '../../utils/frontend_helpers'
import { periodToDates, timeInUserUnit } from '../../utils/periodHelpers.js'
import {
  checkAuthentication,
  getProjectListByCustomer,
  buildTotalHoursForPeriodSelector,
  buildDailyHoursSelector,
  buildworkingTimeSelector,
  workingTimeEntriesMapper,
} from '../../utils/server_method_helpers.js'

function checkTimeEntryRule({
  userId, projectId, task, state, date, hours,
}) {
  const vm = new NodeVM({
    wrapper: 'none',
    timeout: 1000,
    sandbox: {
      user: Meteor.users.findOne({ _id: userId }).profile,
      project: Projects.findOne({ _id: projectId }),
      dayjs,
      timecard: {
        projectId,
        task,
        state,
        date,
        hours,
      },
    },
  })
  try {
    if (!vm.run(getGlobalSetting('timeEntryRule'))) {
      throw new Meteor.Error('notifications.time_entry_rule_failed')
    }
  } catch (error) {
    throw new Meteor.Error(error.message)
  }
}
function insertTimeCard(projectId, task, date, hours, userId) {
  if (!Tasks.findOne({ userId, name: task.replace(/(:.*:)/g, emojify) })) {
    Tasks.insert({ userId, lastUsed: new Date(), name: task.replace(/(:.*:)/g, emojify) })
  } else {
    Tasks.update({ userId, name: task.replace(/(:.*:)/g, emojify) }, { $set: { lastUsed: new Date() } })
  }
  return Timecards.insert({
    userId,
    projectId,
    date,
    hours,
    task: task.replace(/(:.*:)/g, emojify),
  })
}
function upsertTimecard(projectId, task, date, hours, userId) {
  if (!Tasks.findOne({ userId, name: task.replace(/(:.*:)/g, emojify) })) {
    Tasks.insert({ userId, lastUsed: new Date(), name: task.replace(/(:.*:)/g, emojify) })
  } else {
    Tasks.update({ userId, name: task.replace(/(:.*:)/g, emojify) }, { $set: { lastUsed: new Date() } })
  }
  if (hours === 0) {
    Timecards.remove({
      userId,
      projectId,
      date,
      task: task.replace(/(:.*:)/g, emojify),
    })
  } else if (Timecards.find({
    userId,
    projectId,
    date,
    task: task.replace(/(:.*:)/g, emojify),
  }).count() > 1) {
    // if there are more time entries with the same task description for one day,
    // we remove all of them and create a new entry for the total sum
    Timecards.remove({
      userId,
      projectId,
      date,
      task: task.replace(/(:.*:)/g, emojify),
    })
  }
  return Timecards.update({
    userId,
    projectId,
    date,
    task: task.replace(/(:.*:)/g, emojify),
  },
  {
    userId,
    projectId,
    date,
    hours,
    task: task.replace(/(:.*:)/g, emojify),
  }, { upsert: true })
}

Meteor.methods({
  insertTimeCard({
    projectId,
    task,
    date,
    hours,
  }) {
    check(projectId, String)
    check(task, String)
    check(date, Date)
    check(hours, Number)
    checkAuthentication(this)
    checkTimeEntryRule({
      userId: this.userId, projectId, task, state: 'new', date, hours,
    })
    insertTimeCard(projectId, task, date, hours, this.userId)
  },
  upsertWeek(weekArray) {
    checkAuthentication(this)
    check(weekArray, Array)
    weekArray.forEach((element) => {
      check(element.projectId, String)
      check(element.task, String)
      check(element.date, Date)
      check(element.hours, Number)
      checkTimeEntryRule({
        userId: this.userId,
        projectId: element.projectId,
        task: element.task,
        state: 'new',
        date: element.date,
        hours: element.hours,
      })
      upsertTimecard(element.projectId, element.task, element.date, element.hours, this.userId)
    })
  },
  updateTimeCard({
    projectId,
    _id,
    task,
    date,
    hours,
  }) {
    check(projectId, String)
    check(_id, String)
    check(task, String)
    check(date, Date)
    check(hours, Number)
    checkAuthentication(this)
    const timecard = Timecards.findOne({ _id })
    checkTimeEntryRule({
      userId: this.userId, projectId, task, state: timecard.state, date, hours,
    })
    if (!Tasks.findOne({ userId: this.userId, name: task.replace(/(:.*:)/g, emojify) })) {
      Tasks.insert({ userId: this.userId, name: task.replace(/(:.*:)/g, emojify) })
    }
    Timecards.update({ _id }, {
      $set: {
        projectId,
        date,
        hours,
        task: task.replace(/(:.*:)/g, emojify),
      },
    })
  },
  deleteTimeCard({ timecardId }) {
    checkAuthentication(this)
    const timecard = Timecards.findOne({ _id: timecardId })
    checkTimeEntryRule({
      userId: this.userId,
      projectId: timecard.projectId,
      task: timecard.task,
      state: timecard.state,
      date: timecard.date,
      hours: timecard.hours,
    })
    return Timecards.remove({ userId: this.userId, _id: timecardId })
  },
  sendToSiwapp({
    projectId, timePeriod, userId, customer,
  }) {
    check(projectId, String)
    check(timePeriod, String)
    check(userId, String)
    check(customer, String)
    checkAuthentication(this)
    const meteorUser = Meteor.users.findOne({ _id: this.userId })
    if (!meteorUser.profile.siwappurl || !meteorUser.profile.siwapptoken) {
      throw new Meteor.Error(i18next.t('notifications.siwapp_configuration'))
    }
    const { startDate, endDate } = periodToDates(timePeriod)
    const projectMap = new Map()
    const timeEntries = []
    if (projectId === 'all') {
      const projects = getProjectListByCustomer(customer)
      projects.forEach((project) => {
        const resourceMap = new Map()
        if (userId !== 'all') {
          Timecards.find({
            userId,
            projectId: project._id,
            date: { $gte: startDate, $lte: endDate },
          }).forEach((timecard) => {
            timeEntries.push(timecard._id)
            const resource = Meteor.users.findOne({ _id: timecard.userId }).profile.name
            resourceMap.set(resource, resourceMap.get(resource)
              ? resourceMap.get(resource) + timecard.hours : timecard.hours)
          })
          projectMap.set(project.name, resourceMap)
        } else {
          Timecards.find({
            projectId: project._id,
            date: { $gte: startDate, $lte: endDate },
          }).forEach((timecard) => {
            timeEntries.push(timecard._id)
            const resource = Meteor.users.findOne({ _id: timecard.userId }).profile.name
            resourceMap.set(resource, resourceMap.get(resource)
              ? resourceMap.get(resource) + timecard.hours : timecard.hours)
          })
          projectMap.set(project.name, resourceMap)
        }
      })
    } else {
      const project = Projects.findOne(
        {
          _id: projectId,
        },
        { _id: 1, name: 1 },
      )
      const resourceMap = new Map()
      if (userId !== 'all') {
        Timecards.find({
          userId,
          projectId: project._id,
          date: { $gte: startDate, $lte: endDate },
        }).forEach((timecard) => {
          timeEntries.push(timecard._id)
          const resource = Meteor.users.findOne({ _id: timecard.userId }).profile.name
          resourceMap.set(resource, resourceMap.get(resource)
            ? resourceMap.get(resource) + timecard.hours : timecard.hours)
        })
        projectMap.set(project.name, resourceMap)
      } else {
        Timecards.find({
          projectId: project._id,
          date: { $gte: startDate, $lte: endDate },
        }).forEach((timecard) => {
          timeEntries.push(timecard._id)
          const resource = Meteor.users.findOne({ _id: timecard.userId }).profile.name
          resourceMap.set(resource, resourceMap.get(resource)
            ? resourceMap.get(resource) + timecard.hours : timecard.hours)
        })
        projectMap.set(project.name, resourceMap)
      }
    }
    const invoiceJSON = {
      data: {
        attributes: {
          name: 'from titra',
          issue_date: dayjs().format('YYYY-MM-DD'),
          draft: true,
        },
        relationships: {
          items: {
            data: [],
          },
        },
      },
    }
    projectMap.forEach((resources, project) => {
      if (resources.size > 0) {
        resources.forEach((hours, resource) => {
          invoiceJSON.data.relationships.items.data.push({
            attributes: {
              description: `${project} (${resource})`,
              quantity: timeInUserUnit(hours, meteorUser),
              unitary_cost: 0,
            },
          })
        })
      }
    })
    return fetch(`${meteorUser.profile.siwappurl}/api/v1/invoices`, {
      method: 'POST',
      body: JSON.stringify(invoiceJSON),
      headers: {
        Authorization: `Token token=${meteorUser.profile.siwapptoken}`,
        'Content-type': 'application/json',
      },
    }).then((response) => {
      if (response.status === 201) {
        Timecards.update({ _id: { $in: timeEntries } }, { $set: { state: 'billed' } }, { multi: true })
        return 'notifications.siwapp_success'
      }
      return 'notifications.siwapp_configuration'
    }).catch((error) => {
      console.error(error)
      throw new Meteor.Error(error)
    })
  },
  getDailyTimecards({
    projectId,
    userId,
    period,
    dates,
    customer,
    limit,
    page,
  }) {
    check(projectId, String)
    check(period, String)
    check(userId, String)
    if (period === 'custom') {
      check(dates, Object)
      check(dates.startDate, Date)
      check(dates.endDate, Date)
    }
    check(customer, String)
    check(limit, Number)
    check(page, Match.Maybe(Number))
    checkAuthentication(this)
    const aggregationSelector = buildDailyHoursSelector(projectId, period, dates, userId, customer, limit, page)
    const dailyHoursObject = {}
    const totalEntries = Promise.await(Timecards.rawCollection()
      .aggregate(buildDailyHoursSelector(projectId, period, dates, userId, customer, 0))
      .toArray()).length
    const dailyHours = Promise.await(Timecards.rawCollection().aggregate(aggregationSelector)
      .toArray())
    dailyHoursObject.dailyHours = dailyHours
    dailyHoursObject.totalEntries = totalEntries
    return dailyHoursObject
  },
  getTotalHoursForPeriod({
    projectId,
    userId,
    period,
    dates,
    customer,
    limit,
    page,
  }) {
    check(projectId, String)
    check(period, String)
    if (period === 'custom') {
      check(dates, Object)
      check(dates.startDate, Date)
      check(dates.endDate, Date)
    }
    check(userId, String)
    check(customer, String)
    check(limit, Number)
    check(page, Match.Maybe(Number))
    checkAuthentication(this)
    const aggregationSelector = buildTotalHoursForPeriodSelector(projectId, period, dates, userId, customer, limit, page)
    const totalHoursObject = {}
    const totalEntries = Promise.await(Timecards.rawCollection()
      .aggregate(buildTotalHoursForPeriodSelector(projectId, period, dates, userId, customer, 0))
      .toArray()).length
    const totalHours = Promise.await(Timecards.rawCollection().aggregate(aggregationSelector)
      .toArray())
    for (const entry of totalHours) {
      entry.totalHours = Number(JSON.parse(JSON.stringify(entry)).totalHours.$numberDecimal)
    }
    totalHoursObject.totalHours = totalHours
    totalHoursObject.totalEntries = totalEntries
    return totalHoursObject
  },
  getWorkingHoursForPeriod({
    projectId,
    userId,
    period,
    dates,
    limit,
    page,
  }) {
    checkAuthentication(this)
    check(projectId, String)
    check(period, String)
    if (period === 'custom') {
      check(dates, Object)
      check(dates.startDate, Date)
      check(dates.endDate, Date)
    }
    check(userId, String)
    check(limit, Number)
    check(page, Match.Maybe(Number))
    const aggregationSelector = buildworkingTimeSelector(projectId, period, dates, userId, limit, page)
    const totalEntries = Promise.await(
      Timecards.rawCollection()
        .aggregate(buildworkingTimeSelector(projectId, period, dates, userId, 0)).toArray(),
    ).length
    const workingHoursObject = {}
    workingHoursObject.totalEntries = totalEntries
    const workingHours = Promise.await(Timecards.rawCollection().aggregate(aggregationSelector)
      .toArray()).map(workingTimeEntriesMapper)
    workingHoursObject.workingHours = workingHours
    return workingHoursObject
  },
  setTimeEntriesState({ timeEntries, state }) {
    checkAuthentication(this)
    check(state, String)
    check(timeEntries, Array)
    for (const timeEntryId of timeEntries) {
      check(timeEntryId, String)
    }
    if (state === 'exported') {
      Timecards.update({ _id: { $in: timeEntries }, state: { $in: ['new', undefined] } }, { $set: { state } }, { multi: true })
    } else if (state === 'billed') {
      Timecards.update({ _id: { $in: timeEntries }, state: { $ne: 'notBillable' } }, { $set: { state } }, { multi: true })
    } else {
      Timecards.update({ _id: { $in: timeEntries } }, { $set: { state } }, { multi: true })
    }
  },
})

export { insertTimeCard }
