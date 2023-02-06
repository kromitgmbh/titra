import dayjs from 'dayjs'
import { NodeVM } from 'vm2'
import { fetch } from 'meteor/fetch'
import { check, Match } from 'meteor/check'
import Timecards from './timecards.js'
import Tasks from '../tasks/tasks.js'
import Projects from '../projects/projects.js'
import { t } from '../../utils/i18n.js'
import { emojify, getGlobalSetting } from '../../utils/frontend_helpers'
import { timeInUserUnit } from '../../utils/periodHelpers.js'
import {
  checkAuthentication,
  buildTotalHoursForPeriodSelector,
  buildDailyHoursSelector,
  buildworkingTimeSelector,
  workingTimeEntriesMapper,
  buildDetailedTimeEntriesForPeriodSelector,
} from '../../utils/server_method_helpers.js'

async function checkTimeEntryRule({
  userId, projectId, task, state, date, hours,
}) {
  const meteorUser = await Meteor.users.findOneAsync({ _id: userId })
  const vm = new NodeVM({
    wrapper: 'none',
    timeout: 1000,
    sandbox: {
      user: meteorUser.profile,
      project: await Projects.findOneAsync({ _id: projectId }),
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
async function insertTimeCard(projectId, task, date, hours, userId, customfields) {
  const newTimeCard = {
    userId,
    projectId,
    date,
    hours,
    task: task.replace(/(:\S*:)/g, emojify),
    ...customfields,
  }
  if (!await Tasks.findOneAsync({ userId, name: await emojify(task) })) {
    await Tasks.insertAsync({
      userId, lastUsed: new Date(), name: await emojify(task), ...customfields,
    })
  } else {
    await Tasks.updateAsync({ userId, name: await emojify(task) },
      { $set: { lastUsed: new Date(), ...customfields } },
    )
  }
  return Timecards.insertAsync(newTimeCard)
}
async function upsertTimecard(projectId, task, date, hours, userId) {
  if (!await Tasks.findOneAsync({ userId, name: await emojify(task) })) {
    await Tasks.insertAsync({ userId, lastUsed: new Date(), name: await emojify(task) })
  } else {
    await Tasks.updateAsync({ userId, name: await emojify(task) },
      { $set: { lastUsed: new Date() } },
    )
  }
  if (hours === 0) {
    await Timecards.removeAsync({
      userId,
      projectId,
      date,
      task: await emojify(task),
    })
  } else if (await Timecards.find({
    userId,
    projectId,
    date,
    task: await emojify(task),
  }).countAsync() > 1) {
    // if there are more time entries with the same task description for one day,
    // we remove all of them and create a new entry for the total sum
    await Timecards.removeAsync({
      userId,
      projectId,
      date,
      task: await emojify(task),
    })
  }
  return Timecards.updateAsync(
    {
      userId,
      projectId,
      date,
      task: await emojify(task),
    },
    {
      userId,
      projectId,
      date,
      hours,
      task: await emojify(task),
    },

    { upsert: true },
  )
}

Meteor.methods({
  async insertTimeCard({
    projectId,
    task,
    date,
    hours,
    customfields,
  }) {
    check(projectId, String)
    check(task, String)
    check(date, Date)
    check(hours, Number)
    check(customfields, Match.Maybe(Object))
    await checkAuthentication(this)
    await checkTimeEntryRule({
      userId: this.userId, projectId, task, state: 'new', date, hours,
    })
    await insertTimeCard(projectId, task, date, hours, this.userId, customfields)
  },
  async upsertWeek(weekArray) {
    await checkAuthentication(this)
    check(weekArray, Array)
    weekArray.forEach(async (element) => {
      check(element.projectId, String)
      check(element.task, String)
      check(element.date, Date)
      check(element.hours, Number)
      await checkTimeEntryRule({
        userId: this.userId,
        projectId: element.projectId,
        task: element.task,
        state: 'new',
        date: element.date,
        hours: element.hours,
      })
      await upsertTimecard(
        element.projectId,
        element.task,
        element.date,
        element.hours,
        this.userId,
      )
    })
  },
  async updateTimeCard({
    projectId,
    _id,
    task,
    date,
    hours,
    customfields,
  }) {
    check(projectId, String)
    check(_id, String)
    check(task, String)
    check(date, Date)
    check(hours, Number)
    check(customfields, Match.Maybe(Object))
    await checkAuthentication(this)
    const timecard = await Timecards.findOneAsync({ _id })
    await checkTimeEntryRule({
      userId: this.userId, projectId, task, state: timecard.state, date, hours,
    })
    if (!await Tasks.findOneAsync({ userId: this.userId, name: await emojify(task) })) {
      await Tasks.insertAsync({ userId: this.userId, name: await emojify(task), ...customfields })
    }
    await Timecards.updateAsync({ _id }, {
      $set: {
        projectId,
        date,
        hours,
        task: await emojify(task),
        ...customfields,
      },
    })
  },
  async deleteTimeCard({ timecardId }) {
    await checkAuthentication(this)
    const timecard = await Timecards.findOneAsync({ _id: timecardId })
    await checkTimeEntryRule({
      userId: this.userId,
      projectId: timecard.projectId,
      task: timecard.task,
      state: timecard.state,
      date: timecard.date,
      hours: timecard.hours,
    })
    return Timecards.removeAsync({ userId: this.userId, _id: timecardId })
  },
  async sendToSiwapp({
    projectId, timePeriod, userId, customer, dates,
  }) {
    check(projectId, Match.OneOf(String, Array))
    check(timePeriod, String)
    check(userId, Match.OneOf(String, Array))
    check(customer, Match.OneOf(String, Array))
    await checkAuthentication(this)
    const meteorUser = await Meteor.users.findOneAsync({ _id: this.userId })
    if (!meteorUser.profile.siwappurl || !meteorUser.profile.siwapptoken) {
      throw new Meteor.Error(t('notifications.siwapp_configuration'))
    }
    if (timePeriod === 'custom') {
      check(dates, Object)
      check(dates.startDate, Date)
      check(dates.endDate, Date)
    }
    await checkAuthentication(this)
    const timeEntries = []
    const selector = buildDetailedTimeEntriesForPeriodSelector({
      projectId,
      search: undefined,
      customer,
      period: timePeriod,
      dates,
      userId,
      limit: undefined,
      page: undefined,
      sort: undefined,
    })
    const projectMap = new Map()
    for (const timecard of await Timecards.find(selector[0]).fetchAsync()) {
      timeEntries.push(timecard._id)
      const resource = meteorUser.profile.name
      const projectEntry = projectMap.get(timecard.projectId)
      if (projectEntry) {
        projectEntry.set(
          resource,
          (projectEntry.get(resource) ? projectEntry.get(resource) : 0) + timecard.hours,
        )
      } else {
        projectMap.set(timecard.projectId, new Map().set(resource, timecard.hours))
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
    projectMap.forEach(async (resources, project) => {
      const projectElement = await Projects.findOneAsync({ _id: project })
      if (resources.size > 0) {
        resources.forEach((hours, resource) => {
          invoiceJSON.data.relationships.items.data.push({
            attributes: {
              description: `${projectElement.name} (${resource})`,
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
  async getDailyTimecards({
    projectId,
    userId,
    period,
    dates,
    customer,
    limit,
    page,
  }) {
    check(projectId, Match.OneOf(String, Array))
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
    await checkAuthentication(this)
    const aggregationSelector = buildDailyHoursSelector(
      projectId,
      period,
      dates,
      userId,
      customer,
      limit,
      page,
    )
    const dailyHoursObject = {}
    const totalTimeCardsRawCollection = await Timecards.rawCollection()
      .aggregate(buildDailyHoursSelector(projectId, period, dates, userId, customer, 0))
      .toArray()
    const totalEntries = totalTimeCardsRawCollection.length
    const dailyHours = await Timecards.rawCollection().aggregate(aggregationSelector)
      .toArray()
    dailyHoursObject.dailyHours = dailyHours
    dailyHoursObject.totalEntries = totalEntries
    return dailyHoursObject
  },
  async getTotalHoursForPeriod({
    projectId,
    userId,
    period,
    dates,
    customer,
    limit,
    page,
  }) {
    check(projectId, Match.OneOf(String, Array))
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
    await checkAuthentication(this)
    const aggregationSelector = buildTotalHoursForPeriodSelector(
      projectId,
      period,
      dates,
      userId,
      customer,
      limit,
      page,
    )
    const totalHoursObject = {}
    const totalEntriesTimecardsRaw = await Timecards.rawCollection()
      .aggregate(buildTotalHoursForPeriodSelector(projectId, period, dates, userId, customer, 0))
      .toArray()
    const totalEntries = totalEntriesTimecardsRaw.length
    const totalHours = await Timecards.rawCollection().aggregate(aggregationSelector)
      .toArray()
    for (const entry of totalHours) {
      entry.totalHours = Number(JSON.parse(JSON.stringify(entry)).totalHours.$numberDecimal)
    }
    totalHoursObject.totalHours = totalHours
    totalHoursObject.totalEntries = totalEntries
    return totalHoursObject
  },
  async getWorkingHoursForPeriod({
    projectId,
    userId,
    period,
    dates,
    limit,
    page,
  }) {
    await checkAuthentication(this)
    check(projectId, Match.OneOf(String, Array))
    check(period, String)
    if (period === 'custom') {
      check(dates, Object)
      check(dates.startDate, Date)
      check(dates.endDate, Date)
    }
    check(userId, String)
    check(limit, Number)
    check(page, Match.Maybe(Number))
    const aggregationSelector = buildworkingTimeSelector(
      projectId,
      period,
      dates,
      userId,
      limit,
      page,
    )
    const totalEntriesTimecardsRaw = await Timecards.rawCollection()
      .aggregate(buildworkingTimeSelector(projectId, period, dates, userId, 0)).toArray()
    const totalEntries = totalEntriesTimecardsRaw.length
    const workingHoursObject = {}
    workingHoursObject.totalEntries = totalEntries
    const workingHoursTimeCardsRaw = await Timecards.rawCollection().aggregate(aggregationSelector)
      .toArray()
    const workingHours = workingHoursTimeCardsRaw.map(workingTimeEntriesMapper)
    workingHoursObject.workingHours = workingHours
    return workingHoursObject
  },
  async setTimeEntriesState({ timeEntries, state }) {
    await checkAuthentication(this)
    check(state, String)
    check(timeEntries, Array)
    for (const timeEntryId of timeEntries) {
      check(timeEntryId, String)
    }
    if (state === 'exported') {
      await Timecards.updateAsync({ _id: { $in: timeEntries }, state: { $in: ['new', undefined] } }, { $set: { state } }, { multi: true })
    } else if (state === 'billed') {
      await Timecards.updateAsync({ _id: { $in: timeEntries }, state: { $ne: 'notBillable' } }, { $set: { state } }, { multi: true })
    } else {
      await Timecards.updateAsync({ _id: { $in: timeEntries } },
        { $set: { state } },
        { multi: true },
      )
    }
  },
})

export { insertTimeCard, upsertTimecard }
