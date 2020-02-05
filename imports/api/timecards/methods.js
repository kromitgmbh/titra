import dayjs from 'dayjs'
import { emojify } from '../../utils/frontend_helpers'
import i18next from 'i18next'
import { HTTP } from 'meteor/http'
import { check, Match } from 'meteor/check'
import { Promise } from 'meteor/promise'
import Timecards from './timecards.js'
import Tasks from '../tasks/tasks.js'
import Projects from '../projects/projects.js'
import { periodToDates, timeInUserUnit } from '../../utils/periodHelpers.js'
import {
  checkAuthentication,
  getProjectListByCustomer,
  totalHoursForPeriodMapper,
  dailyTimecardMapper,
  buildTotalHoursForPeriodSelector,
  buildDailyHoursSelector,
  buildworkingTimeSelector,
  workingTimeEntriesMapper,
} from '../../utils/server_method_helpers.js'


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
    HTTP.post(`${meteorUser.profile.siwappurl}/api/v1/invoices`, {
      data: invoiceJSON,
      headers: {
        Authorization: `Token token=${meteorUser.profile.siwapptoken}`,
        'Content-type': 'application/json',
      },
    })
    return 'Siwapp invoice created successfully.'
  },
  getDailyTimecards({
    projectId,
    userId,
    period,
    customer,
    limit,
    page,
  }) {
    check(projectId, String)
    check(period, String)
    check(userId, String)
    check(customer, String)
    check(limit, Number)
    check(page, Match.Maybe(Number))
    checkAuthentication(this)
    const aggregationSelector = buildDailyHoursSelector(projectId, period, userId, customer, limit, page)
    const dailyHoursObject = {}
    const totalEntries = Promise.await(Timecards.rawCollection()
      .aggregate(buildDailyHoursSelector(projectId, period, userId, customer, 0))
      .toArray()).length
    const dailyHours = Promise.await(Timecards.rawCollection().aggregate(aggregationSelector)
      .toArray()).map(dailyTimecardMapper)
    dailyHoursObject.dailyHours = dailyHours
    dailyHoursObject.totalEntries = totalEntries
    return dailyHoursObject
  },
  getTotalHoursForPeriod({
    projectId,
    userId,
    period,
    customer,
    limit,
    page,
  }) {
    check(projectId, String)
    check(period, String)
    check(userId, String)
    check(customer, String)
    check(limit, Number)
    check(page, Match.Maybe(Number))
    checkAuthentication(this)
    const aggregationSelector = buildTotalHoursForPeriodSelector(projectId, period, userId, customer, limit, page)
    const totalHoursObject = {}
    const totalEntries = Promise.await(Timecards.rawCollection()
      .aggregate(buildTotalHoursForPeriodSelector(projectId, period, userId, customer, 0))
      .toArray()).length
    const totalHours = Promise.await(Timecards.rawCollection().aggregate(aggregationSelector)
      .toArray()).map(totalHoursForPeriodMapper)
    totalHoursObject.totalHours = totalHours
    totalHoursObject.totalEntries = totalEntries
    return totalHoursObject
  },
  getWorkingHoursForPeriod({
    projectId,
    userId,
    period,
    limit,
    page,
  }) {
    check(projectId, String)
    check(period, String)
    check(userId, String)
    check(limit, Number)
    check(page, Match.Maybe(Number))
    const aggregationSelector = buildworkingTimeSelector(projectId, period, userId, limit, page)
    const totalEntries = Promise.await(
      Timecards.rawCollection()
        .aggregate(buildworkingTimeSelector(projectId, period, userId, 0)).toArray(),
    ).length
    const workingHoursObject = {}
    workingHoursObject.totalEntries = totalEntries
    const workingHours = Promise.await(Timecards.rawCollection().aggregate(aggregationSelector)
      .toArray()).map(workingTimeEntriesMapper)
    workingHoursObject.workingHours = workingHours
    return workingHoursObject
  },
})

export { insertTimeCard }
