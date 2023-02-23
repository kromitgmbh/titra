import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import Projects from '../api/projects/projects.js'
import Transactions from '../api/transactions/transactions.js'
import { projectResources } from '../api/users/users.js'
import { periodToDates } from './periodHelpers.js'
import { getGlobalSetting, getUserSetting } from './frontend_helpers.js'

/**
 * Gets the list of projects for the current user.
 * @param {string[]} projectId - The list of project IDs to get.
 * @returns {string[]} The list of project IDs.
 * @throws {Meteor.Error} If user is not authenticated.
 */
function getProjectListById(projectId) {
  let projectList = []
  const userId = Meteor.userId()
  if (projectId.includes('all')) {
    projectList = Projects.find(
      {
        $or: [{ userId }, { public: true }, { team: userId }],
      },
      { $fields: { _id: 1 } },
    ).fetch().map((value) => value._id)
  } else {
    const projectSelector = {
      _id: projectId,
      $or: [{ userId }, { public: true }, { team: userId }],
    }
    if (projectId instanceof Array) {
      projectSelector._id = { $in: projectId }
    }
    projectList = Projects.find(
      projectSelector,
      { $fields: { _id: 1 } },
    ).fetch().map((value) => value._id)
  }
  return projectList
}
/**
 * Checks if the current user is authenticated.
 * @param {Object} context - The Meteor.js context object.
 * @throws {Meteor.Error} If user is not authenticated.
 */
async function checkAuthentication(context) {
  const meteorUser = await Meteor.users.findOneAsync({ _id: context.userId })
  if (!context.userId || meteorUser?.inactive) {
    throw new Meteor.Error('notifications.auth_error_method')
  }
}
/**
 * Checks if the current user is authenticated and an admin.
 * @param {Object} context - The Meteor.js context object.
 * @throws {Meteor.Error} If user is not authenticated or not an admin.
 */
async function checkAdminAuthentication(context) {
  const meteorUser = await Meteor.users.findOneAsync({ _id: context.userId })
  if (!context.userId || meteorUser?.inactive) {
    throw new Meteor.Error('notifications.auth_error_method')
  } else if (!meteorUser.isAdmin) {
    throw new Meteor.Error('notifications.auth_error_method')
  }
}
/**
 * Get the project list based on the provided customer(s)
 * @param {string[]} customer - The list of customer IDs to get.
 * @returns {string[]} The list of project IDs.
 * @throws {Meteor.Error} If user is not authenticated.
 */
function getProjectListByCustomer(customer) {
  let projects = []
  const userId = Meteor.userId()

  if (customer.includes('all')) {
    projects = Projects.find(
      {
        $or: [{ userId }, { public: true }, { team: userId }],
      },
      { _id: 1, name: 1 },
    )
  } else {
    const selector = {
      customer, $or: [{ userId }, { public: true }, { team: userId }],
    }
    if (customer instanceof Array) {
      selector.customer = { $in: customer }
    }
    projects = Projects.find(
      selector,
      { _id: 1, name: 1 },
    )
  }
  return projects
}
/**
 * Mapper function for the totalHoursForPeriod publication.
 * @param {Object} entry - The entry to map.
 * @returns {Object} The mapped entry.
 */
function totalHoursForPeriodMapper(entry) {
  let { totalHours } = entry
  if (Meteor.user()) {
    if (getUserSetting('timeunit') === 'd') {
      totalHours = Number(entry.totalHours / getUserSetting('hoursToDays'))
    }
    if (getUserSetting('timeunit') === 'm') {
      totalHours = Number(entry.totalHours * 60)
    }
  }
  return {
    projectId: Projects.findOne({ _id: entry._id.projectId })?.name,
    userId: projectResources.findOne({ _id: entry._id.userId })?.name,
    totalHours,
  }
}

/**
 * Mapper function for the dailyTimecard method.
 * @param {Object} entry - The entry to map.
 * @returns {Object} The mapped entry.
 */
function dailyTimecardMapper(entry) {
  let { totalHours } = entry
  if (Meteor.user()) {
    if (getUserSetting('timeunit') === 'd') {
      totalHours = Number(entry.totalHours / getUserSetting('hoursToDays'))
    }
    if (getUserSetting('timeunit') === 'm') {
      totalHours = Number(entry.totalHours * 60)
    }
  }
  return {
    date: entry._id.date,
    projectId: Projects.findOne({ _id: entry._id.projectId })?.name,
    userId: projectResources.findOne({ _id: entry._id.userId })?.name,
    totalHours,
  }
}
/**
 * Builds the selector for the totalHoursForPeriod publication.
 * @param {string[]} projectId - The list of project IDs to get.
 * @param {string} period - The period to get.
 * @param {string[]} dates - The list of dates to get.
 * @param {string[]} userId - The list of user IDs to get.
 * @param {string[]} customer - The list of customer IDs to get.
 * @param {number} limit - The limit of entries to get.
 * @param {number} page - The page of entries to get.
 * @returns {Object} The selector.
 */
function buildTotalHoursForPeriodSelector(projectId, period, dates, userId, customer, limit, page) {
  let projectList = []
  const periodArray = []
  let matchSelector = {}
  const addFields = {
    $addFields: {
      convertedHours: { $toDecimal: '$hours' },
    },
  }
  const groupSelector = {
    $group: {
      _id: { userId: '$userId', projectId: '$projectId' },
      totalHours: { $sum: '$convertedHours' },
    },
  }
  const sortSelector = {
    $sort: {
      date: -1,
    },
  }
  const skipSelector = {
    $skip: 0,
  }
  if (page) {
    skipSelector.$skip = (page - 1) * limit
  }
  const limitSelector = {
    $limit: limit,
  }
  if (!customer.includes('all')) {
    projectList = getProjectListByCustomer(customer).fetch().map((value) => value._id)
  } else {
    projectList = getProjectListById(projectId)
  }
  if (period && period.includes('custom')) {
    matchSelector = {
      $match: {
        projectId: { $in: projectList },
        date: { $gte: dates.startDate, $lte: dates.endDate },
      },
    }
    if (!userId.includes('all')) {
      matchSelector = {
        $match: {
          projectId: { $in: projectList },
          date: { $gte: dates.startDate, $lte: dates.endDate },
          userId,
        },
      }
    }
  } else if (period && period !== 'all') {
    const { startDate, endDate } = periodToDates(period)
    matchSelector = {
      $match: {
        projectId: { $in: projectList },
        date: { $gte: startDate, $lte: endDate },
      },
    }
    if (!userId.includes('all')) {
      matchSelector = {
        $match: {
          projectId: { $in: projectList },
          date: { $gte: startDate, $lte: endDate },
          userId,
        },
      }
    }
  } else if (userId.includes('all')) {
    matchSelector = {
      $match: {
        projectId: { $in: projectList },
      },
    }
  }
  periodArray.push(addFields)
  periodArray.push(matchSelector)
  periodArray.push(groupSelector)
  periodArray.push(sortSelector)
  periodArray.push(skipSelector)
  if (limit > 0) {
    periodArray.push(limitSelector)
  }
  return periodArray
}
/**
 * Builds the selector for the dailyHours publication.
 * @param {string[]} projectId - The list of project IDs to get.
 * @param {string} period - The period to get.
 * @param {string[]} dates - The list of dates to get.
 * @param {string[]} userId - The list of user IDs to get.
 * @param {string[]} customer - The list of customer IDs to get.
 * @param {number} limit - The limit of entries to get.
 * @param {number} page - The page of entries to get.
 * @returns {Object} The selector.
 */
function buildDailyHoursSelector(projectId, period, dates, userId, customer, limit, page) {
  let projectList = []
  if (!customer.includes('all')) {
    projectList = getProjectListByCustomer(customer).fetch().map((value) => value._id)
  } else {
    projectList = getProjectListById(projectId)
  }
  const dailyArray = []
  let matchSelector = {}
  const skipSelector = {
    $skip: 0,
  }
  if (page) {
    skipSelector.$skip = (page - 1) * limit
  }
  const sortSelector = {
    $sort: {
      date: -1,
    },
  }
  const groupSelector = {
    $group: {
      _id: { userId: '$userId', projectId: '$projectId', date: '$date' },
      totalHours: { $sum: '$hours' },
    },
  }
  const limitSelector = {
    $limit: limit,
  }
  if (period && period === 'custom') {
    if (userId.includes('all')) {
      matchSelector = {
        $match: {
          projectId: { $in: projectList },
          date: { $gte: dates.startDate, $lte: dates.endDate },
        },
      }
    } else {
      matchSelector = {
        $match: {
          projectId: { $in: projectList },
          date: { $gte: dates.startDate, $lte: dates.endDate },
          userId,
        },
      }
    }
  } else if (period && period !== 'all') {
    const { startDate, endDate } = periodToDates(period)
    if (userId.includes('all')) {
      matchSelector = {
        $match: {
          projectId: { $in: projectList },
          date: { $gte: startDate, $lte: endDate },
        },
      }
    } else {
      matchSelector = {
        $match: {
          projectId: { $in: projectList },
          date: { $gte: startDate, $lte: endDate },
          userId,
        },
      }
    }
  } else if (userId.includes('all')) {
    matchSelector = {
      $match: {
        projectId: { $in: projectList },
      },
    }
  } else {
    matchSelector = {
      $match: {
        projectId: { $in: projectList },
        userId,
      },
    }
  }
  dailyArray.push(matchSelector)
  dailyArray.push(groupSelector)
  dailyArray.push(sortSelector)
  dailyArray.push(skipSelector)
  if (limit > 0) {
    dailyArray.push(limitSelector)
  }
  return dailyArray
}
/**
 * Builds the selector for the workingTime publication.
 * @param {string[]} projectId - The list of project IDs to get.
 * @param {string} period - The period to get.
 * @param {string[]} dates - The list of dates to get.
 * @param {string[]} userId - The list of user IDs to get.
 * @param {number} limit - The limit of entries to get.
 * @param {number} page - The page of entries to get.
 * @returns {Object} The selector.
 */
function buildworkingTimeSelector(projectId, period, dates, userId, limit, page) {
  let projectList = []
  projectList = getProjectListById(projectId)
  const workingTimeArray = []
  const skipSelector = {
    $skip: 0,
  }
  if (page) {
    skipSelector.$skip = (page - 1) * limit
  }
  let matchSelector = {}
  const sortSelector = {
    $sort: {
      date: -1,
    },
  }
  const groupSelector = {
    $group: {
      _id: { userId: '$userId', date: '$date' },
      totalTime: { $sum: '$hours' },
    },
  }
  const limitSelector = {
    $limit: limit,
  }
  if (period && period === 'custom') {
    if (userId.includes('all')) {
      matchSelector = {
        $match: {
          projectId: { $in: projectList },
          date: { $gte: dates.startDate, $lte: dates.endDate },
        },
      }
    } else {
      matchSelector = {
        $match: {
          projectId: { $in: projectList },
          date: { $gte: dates.startDate, $lte: dates.endDate },
          userId,
        },
      }
    }
  } else if (period && period !== 'all') {
    const { startDate, endDate } = periodToDates(period)
    if (userId.includes('all')) {
      matchSelector = {
        $match: {
          projectId: { $in: projectList },
          date: { $gte: startDate, $lte: endDate },
        },
      }
    } else {
      matchSelector = {
        $match: {
          projectId: { $in: projectList },
          date: { $gte: startDate, $lte: endDate },
          userId,
        },
      }
    }
  } else if (userId.includes('all')) {
    matchSelector = {
      $match: {
        projectId: { $in: projectList },
      },
    }
  } else {
    matchSelector = {
      $match: {
        projectId: { $in: projectList },
        userId,
      },
    }
  }
  workingTimeArray.push(matchSelector)
  workingTimeArray.push(groupSelector)
  workingTimeArray.push(skipSelector)
  workingTimeArray.push(sortSelector)
  if (limit > 0) {
    workingTimeArray.push(limitSelector)
  }
  return workingTimeArray
}
/**
 * Mapper function for the working time entries publication
 * @param {Object} entry - The entry to map.
 * @returns {Object} The mapped entry.
 */
function workingTimeEntriesMapper(entry) {
  dayjs.extend(customParseFormat)
  const meteorUser = Meteor.users.findOne({ _id: entry._id.userId })
  const userBreakStartTime = dayjs(meteorUser?.profile?.breakStartTime ? meteorUser.profile.breakStartTime : getGlobalSetting('breakStartTime'), 'HH:mm')
  const userBreakDuration = meteorUser?.profile?.breakDuration ? meteorUser.profile.breakDuration : getGlobalSetting('breakDuration')
  const userBreakEndTime = dayjs(userBreakStartTime, 'HH:mm').add(userBreakDuration, 'hour')
  const userRegularWorkingTime = meteorUser?.profile?.regularWorkingTime ? meteorUser.profile.regularWorkingTime : getGlobalSetting('regularWorkingTime')
  const userStartTime = meteorUser?.profile?.dailyStartTime ? meteorUser.profile.dailyStartTime : getGlobalSetting('dailyStartTime')
  let userEndTime = dayjs(userStartTime, 'HH:mm').add(entry.totalTime, 'hour')
  if (getGlobalSetting('addBreakToWorkingTime')) {
    userEndTime = userEndTime.add(userBreakDuration, 'hour')
  }
  return {
    date: entry._id.date,
    resource: meteorUser?.profile?.name,
    startTime: userStartTime,
    breakStartTime: userEndTime.isAfter(userBreakStartTime) ? userBreakStartTime.format('HH:mm') : '',
    breakEndTime: userEndTime.isAfter(userBreakStartTime) ? userBreakEndTime.format('HH:mm') : '',
    endTime: userEndTime.format('HH:mm'),
    totalTime: entry.totalTime,
    regularWorkingTime: Number(userRegularWorkingTime),
    regularWorkingTimeDifference: entry.totalTime - userRegularWorkingTime,
  }
}
/**
 * Builds the selector for the detailedTimeEntries publication.
 * @param {string[]} projectId - The list of project IDs to get.
 * @param {string} search - The search string to get.
 * @param {string[]} customer - The list of customer IDs to get.
 * @param {string} period - The period to get.
 * @param {Object} dates - The dates to get.
 * @param {string[]} userId - The list of user IDs to get.
 * @param {number} limit - The limit to get.
 * @param {number} page - The page to get.
 * @param {Object} sort - The sort to get.
 * @returns {Object} The selector for the detailedTimeEntries method.
 */
function buildDetailedTimeEntriesForPeriodSelector({
  projectId, search, customer, period, dates, userId, limit, page, sort,
}) {
  const detailedTimeArray = []
  let projectList = getProjectListById(projectId)
  if (!customer.includes('all') && projectId.includes('all')) {
    projectList = getProjectListByCustomer(customer).fetch().map((value) => value._id)
  }
  const query = { projectId: { $in: projectList } }
  if (search) {
    query.task = { $regex: `.*${search.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' }
  }
  const options = { sort: {} }
  if (limit && limit > 0) {
    options.limit = limit
  }
  if (sort) {
    let field
    let order
    switch (sort.column) {
      case 0:
        field = 'projectId'
        break
      case 1:
        field = 'date'
        break
      case 2:
        field = 'task'
        break
      case 3:
        field = 'userId'
        break
      case 4:
        field = 'hours'
        break
      default:
        field = 'date'
    }
    switch (sort.order) {
      case 'asc':
        order = 1
        break
      case 'desc':
        order = -1
        break
      default:
        order = -1
        break
    }
    options.sort[field] = order
  } else {
    options.sort = { date: -1 }
  }

  if (page) {
    options.skip = (page - 1) * limit
  }
  if (period === 'custom') {
    query.date = { $gte: dates.startDate, $lte: dates.endDate }
  } else if (period !== 'all') {
    const { startDate, endDate } = periodToDates(period)
    query.date = { $gte: startDate, $lte: endDate }
  }
  if (!userId.includes('all')) {
    if (userId instanceof Array) {
      query.userId = { $in: userId }
    } else {
      query.userId = userId
    }
  }
  detailedTimeArray.push(query)
  detailedTimeArray.push(options)
  return detailedTimeArray
}
function authenticationMixin(methodOptions) {
  const runFunc = methodOptions.run
  methodOptions.run = async function (args) {
    await checkAuthentication(this)
    return runFunc.call(this, args)
  }
  return methodOptions
}
function adminAuthenticationMixin(methodOptions) {
  const runFunc = methodOptions.run
  methodOptions.run = async function (args) {
    await checkAdminAuthentication(this)
    return runFunc.call(this, args)
  }
  return methodOptions
}
function transactionLogMixin(methodOptions) {
  const runFunc = methodOptions.run
  methodOptions.run = async function (args) {
    if (getGlobalSetting('enableTransactions')) {
      const user = await Meteor.users.findOneAsync({ _id: this.userId }, {
        _id: 1, 'profile.name': 1, emails: 1, isAdmin: 1,
      })
      const transaction = {
        user: JSON.stringify({
          _id: user._id, name: user.profile.name, emails: user.emails, isAdmin: user.isAdmin,
        }),
        method: this.name,
        args: JSON.stringify(args),
        timestamp: new Date(),
      }
      Transactions.insert(transaction)
    }
    return runFunc.call(this, args)
  }
  return methodOptions
}

export {
  authenticationMixin,
  adminAuthenticationMixin,
  transactionLogMixin,
  checkAuthentication,
  checkAdminAuthentication,
  getProjectListById,
  getProjectListByCustomer,
  totalHoursForPeriodMapper,
  dailyTimecardMapper,
  buildTotalHoursForPeriodSelector,
  buildDailyHoursSelector,
  workingTimeEntriesMapper,
  buildworkingTimeSelector,
  buildDetailedTimeEntriesForPeriodSelector,
}
