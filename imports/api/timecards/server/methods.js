import { ValidatedMethod } from 'meteor/mdg:validated-method'
import dayjs from 'dayjs'
import { NodeVM } from 'vm2'
import { fetch } from 'meteor/fetch'
import { check, Match } from 'meteor/check'
import Timecards from '../timecards.js'
import Tasks from '../../tasks/tasks.js'
import Projects from '../../projects/projects.js'
import { t } from '../../../utils/i18n.js'
import { emojify, getGlobalSetting } from '../../../utils/frontend_helpers'
import { timeInUserUnit } from '../../../utils/periodHelpers.js'
import {
  authenticationMixin,
  transactionLogMixin,
  buildTotalHoursForPeriodSelector,
  buildDailyHoursSelector,
  buildworkingTimeSelector,
  workingTimeEntriesMapper,
  buildDetailedTimeEntriesForPeriodSelector,
} from '../../../utils/server_method_helpers.js'
/**
 * Inserts a new timecard into the Timecards collection.
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string} args.projectId - The ID of the project for the timecard.
 * @param {string} args.task - The task for the timecard.
 * @param {Date} args.date - The date of the timecard.
 * @param {number} args.hours - The number of hours for the timecard.
 * @param {string} [args.userId] - The ID of the user for the timecard.
 * @param {Object} [args.customfields] - The custom fields for the timecard.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If time entry rule fails.
 * @throws {Meteor.Error} If time entry rule throws an error.
 * @throws {Meteor.Error} If time entry rule is not a function.
 * @throws {Meteor.Error} If time entry rule is not a string.
 * @throws {Meteor.Error} If time entry rule is not a valid JavaScript expression.
 */
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
/**
 * Inserts a new timecard into the Timecards collection.
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string} args.projectId - The ID of the project for the timecard.
 * @param {string} args.task - The task for the timecard.
 * @param {Date} args.date - The date of the timecard.
 * @param {number} args.hours - The number of hours for the timecard.
 * @param {string} [args.userId] - The ID of the user for the timecard.
 * @param {Object} [args.customfields] - The custom fields for the timecard.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If time entry rule fails.
 * @throws {Meteor.Error} If time entry rule throws an error.
 */
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
    await Tasks.updateAsync(
      { userId, name: await emojify(task) },
      { $set: { lastUsed: new Date(), ...customfields } },
    )
  }
  return Timecards.insertAsync(newTimeCard)
}
/**
 * Updates an existing timecard in the Timecards collection.
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string} args.projectId - The ID of the project for the timecard.
 * @param {string} args.task - The task for the timecard.
 * @param {Date} args.date - The date of the timecard.
 * @param {number} args.hours - The number of hours for the timecard.
 * @param {string} [args.userId] - The ID of the user for the timecard.
 * @param {Object} [args.customfields] - The custom fields for the timecard.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If time entry rule fails.
 */
async function upsertTimecard(projectId, task, date, hours, userId) {
  if (!await Tasks.findOneAsync({ userId, name: await emojify(task) })) {
    await Tasks.insertAsync({ userId, lastUsed: new Date(), name: await emojify(task) })
  } else {
    await Tasks.updateAsync(
      { userId, name: await emojify(task) },
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
  await Timecards.updateAsync(
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
  return 'notifications.success'
}
/**
 * Inserts a new timecard into the Timecards collection.
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string} args.projectId - The ID of the project for the timecard.
 * @param {string} args.task - The task for the timecard.
 * @param {Date} args.date - The date of the timecard.
 * @param {number} args.hours - The number of hours for the timecard.
 * @param {string} [args.userId] - The ID of the user for the timecard.
 * @param {Object} [args.customfields] - The custom fields for the timecard.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If time entry rule fails.
 */
const insertTimeCardMethod = new ValidatedMethod({
  name: 'insertTimeCard',
  validate(args) {
    check(args.projectId, Match.Maybe(String))
    check(args.task, String)
    check(args.date, Date)
    check(args.hours, Number)
    check(args.customfields, Match.Maybe(Object))
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run({
    projectId, task, date, hours, customfields,
  }) {
    await checkTimeEntryRule({
      userId: this.userId, projectId, task, state: 'new', date, hours,
    })
    await insertTimeCard(projectId, task, date, hours, this.userId, customfields)
  },
})
/**
 * Updates an existing timecard in the Timecards collection.
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string} args.projectId - The ID of the project for the timecard.
 * @param {string} args.task - The task for the timecard.
 * @param {Date} args.date - The date of the timecard.
 * @param {number} args.hours - The number of hours for the timecard.
 * @param {string} [args.userId] - The ID of the user for the timecard.
 * @param {Object} [args.customfields] - The custom fields for the timecard.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If time entry rule fails.
 * @throws {Meteor.Error} If timecard does not exist.
 */
const upsertWeek = new ValidatedMethod({
  name: 'upsertWeek',
  validate(args) {
    check(args, Array)
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run(weekArray) {
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
})
/**
 * Updates an existing timecard in the Timecards collection.
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string} args.projectId - The ID of the project for the timecard.
 * @param {string} args._id - The ID of the timecard.
 * @param {string} args.task - The task for the timecard.
 * @param {Date} args.date - The date of the timecard.
 * @param {number} args.hours - The number of hours for the timecard.
 * @param {string} [args.userId] - The ID of the user for the timecard.
 * @param {Object} [args.customfields] - The custom fields for the timecard.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If time entry rule fails.
 * @throws {Meteor.Error} If timecard does not exist.
 */
const updateTimeCard = new ValidatedMethod({
  name: 'updateTimeCard',
  validate(args) {
    check(args.projectId, String)
    check(args._id, String)
    check(args.task, String)
    check(args.date, Date)
    check(args.hours, Number)
    check(args.customfields, Match.Maybe(Object))
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run({
    projectId, _id, task, date, hours, customfields,
  }) {
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
})
/**
 * Deletes an existing timecard in the Timecards collection.
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string} args.timecardId - The ID of the timecard.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If time entry rule fails.
 * @throws {Meteor.Error} If timecard does not exist.
 * @throws {Meteor.Error} If timecard is not owned by user.
 */
const deleteTimeCard = new ValidatedMethod({
  name: 'deleteTimeCard',
  validate(args) {
    check(args, {
      timecardId: String,
    })
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run({ timecardId }) {
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
})
/**
 * Creates an invoice in Siwapp through the API and
 * updates the state of a timecard in the Timecards collection.
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string} args.projectId - The ID of the project.
 * @param {string} args.timePeriod - The time period for the invoice.
 * @param {string} [args.userId] - The ID of the user.
 * @param {string} [args.customer] - The ID of the customer.
 * @param {Object} [args.dates] - The start and end dates for the invoice.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 */
const sendToSiwapp = new ValidatedMethod({
  name: 'sendToSiwapp',
  validate(args) {
    check(args.projectId, Match.OneOf(String, Array))
    check(args.timePeriod, String)
    check(args.userId, Match.OneOf(String, Array))
    check(args.customer, Match.OneOf(String, Array))
    check(args.dates, Match.Maybe(Object))
    if (args.timePeriod === 'custom') {
      check(args.dates, Object)
      check(args.dates.startDate, Date)
      check(args.dates.endDate, Date)
    }
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run({
    projectId, timePeriod, userId, customer, dates,
  }) {
    const meteorUser = await Meteor.users.findOneAsync({ _id: this.userId })
    if (!meteorUser.profile.siwappurl || !meteorUser.profile.siwapptoken) {
      throw new Meteor.Error(t('notifications.siwapp_configuration'))
    }
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
    for await (const [project, resources] of projectMap.entries()) {
      const projectElement = await Projects.findOneAsync({ _id: project })
      if (resources.size > 0) {
        for (const [resource, hours] of resources) {
          invoiceJSON.data.relationships.items.data.push({
            attributes: {
              description: `${projectElement.name} (${resource})`,
              quantity: timeInUserUnit(hours, meteorUser),
              unitary_cost: 0,
            },
          })
        }
      }
    }
    try {
      const response = await fetch(`${meteorUser.profile.siwappurl}/api/v1/invoices`, {
        method: 'POST',
        body: JSON.stringify(invoiceJSON),
        headers: {
          Authorization: `Token token=${meteorUser.profile.siwapptoken}`,
          'Content-type': 'application/json',
        },
      })
      if (response.status === 201) {
        Timecards.update({ _id: { $in: timeEntries } }, { $set: { state: 'billed' } }, { multi: true })
        return 'notifications.siwapp_success'
      }
      return 'notifications.siwapp_configuration'
    } catch (error) {
      console.error(error)
      throw new Meteor.Error(error)
    }
  },
})
/**
 * Gets the daily timecards sum for a given period.
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string} args.projectId - The ID of the project.
 * @param {string} args.userId - The ID of the user.
 * @param {string} args.period - The time period for the invoice.
 * @param {Object} [args.dates] - The start and end dates for the invoice.
 * @param {string} [args.customer] - The ID of the customer.
 * @param {number} [args.limit] - The number of timecards to return.
 * @param {number} [args.page] - The page number.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {Object} The daily timecards sum for a given period.
*/
const getDailyTimecards = new ValidatedMethod({
  name: 'getDailyTimecards',
  validate(args) {
    check(args.projectId, Match.OneOf(String, Array))
    check(args.userId, String)
    check(args.period, String)
    check(args.customer, String)
    check(args.limit, Number)
    check(args.dates, Match.Maybe(Object))
    check(args.page, Match.Maybe(Number))
    if (args.period === 'custom') {
      check(args.dates, Object)
      check(args.dates.startDate, Date)
      check(args.dates.endDate, Date)
    }
  },
  mixins: [authenticationMixin],
  async run({
    projectId, userId, period, dates, customer, limit, page,
  }) {
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
})
/**
 * Gets the total hours for a given period.
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string} args.projectId - The ID of the project.
 * @param {string} args.userId - The ID of the user.
 * @param {string} args.period - The time period for the invoice.
 * @param {Object} [args.dates] - The start and end dates for the invoice.
 * @param {string} [args.customer] - The ID of the customer.
 * @param {number} [args.limit] - The number of timecards to return.
 * @param {number} [args.page] - The page number.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {Object} The total hours for a given period.
 */
const getTotalHoursForPeriod = new ValidatedMethod({
  name: 'getTotalHoursForPeriod',
  validate(args) {
    check(args.projectId, Match.OneOf(String, Array))
    check(args.userId, String)
    check(args.period, String)
    check(args.customer, String)
    check(args.limit, Number)
    check(args.dates, Match.Maybe(Object))
    check(args.page, Match.Maybe(Number))
    if (args.period === 'custom') {
      check(args.dates, Object)
      check(args.dates.startDate, Date)
      check(args.dates.endDate, Date)
    }
  },
  mixins: [authenticationMixin],
  async run({
    projectId, userId, period, dates, customer, limit, page,
  }) {
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
})
/**
 * Gets the working hours for a given period.
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string} args.projectId - The ID of the project.
 * @param {string} args.userId - The ID of the user.
 * @param {string} args.period - The time period for the invoice.
 * @param {Object} [args.dates] - The start and end dates for the invoice.
 * @param {number} [args.limit] - The number of timecards to return.
 * @param {number} [args.page] - The page number.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {Object} The working hours for a given period.
 */
const getWorkingHoursForPeriod = new ValidatedMethod({
  name: 'getWorkingHoursForPeriod',
  validate(args) {
    check(args.projectId, Match.OneOf(String, Array))
    check(args.userId, String)
    check(args.period, String)
    check(args.limit, Number)
    check(args.dates, Match.Maybe(Object))
    check(args.page, Match.Maybe(Number))
    if (args.period === 'custom') {
      check(args.dates, Object)
      check(args.dates.startDate, Date)
      check(args.dates.endDate, Date)
    }
  },
  mixins: [authenticationMixin],
  async run({
    projectId, userId, period, dates, limit, page,
  }) {
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
})
/**
 * Sets the time entry state for a list of time entries
 * @param {Object} args - The arguments object containing the timecard information.
 * @param {string[]} args.timeEntries - The IDs of the time entries.
 * @param {string} args.state - The state to set the time entries to.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {undefined}
 */
const setTimeEntriesState = new ValidatedMethod({
  name: 'setTimeEntriesState',
  validate(args) {
    check(args, {
      timeEntries: Array,
      state: String,
    })
    for (const timeEntryId of args.timeEntries) {
      check(timeEntryId, String)
    }
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run({ timeEntries, state }) {
    if (state === 'exported') {
      await Timecards.updateAsync({ _id: { $in: timeEntries }, state: { $in: ['new', undefined] } }, { $set: { state } }, { multi: true })
    } else if (state === 'billed') {
      await Timecards.updateAsync({ _id: { $in: timeEntries }, state: { $ne: 'notBillable' } }, { $set: { state } }, { multi: true })
    } else {
      await Timecards.updateAsync(
        { _id: { $in: timeEntries } },
        { $set: { state } },
        { multi: true },
      )
    }
  },
})
export {
  insertTimeCard,
  insertTimeCardMethod,
  upsertTimecard,
  upsertWeek,
  updateTimeCard,
  deleteTimeCard,
  setTimeEntriesState,
  getWorkingHoursForPeriod,
  getTotalHoursForPeriod,
  getDailyTimecards,
  sendToSiwapp,
}
