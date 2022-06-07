import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { t } from './i18n.js'
import Projects from '../api/projects/projects.js'
import projectUsers from '../api/users/users.js'
import { periodToDates } from './periodHelpers.js'
import { getGlobalSetting, getUserSetting } from './frontend_helpers.js'

function getProjectListById(projectId) {
  let projectList = []
  const userId = Meteor.userId()
  if (projectId === 'all') {
    projectList = Projects.find(
      {
        $or: [{ userId }, { public: true }, { team: userId }],
      },
      { $fields: { _id: 1 } },
    ).fetch().map((value) => value._id)
  } else {
    projectList = [projectId]
  }
  return projectList
}
function checkAuthentication(context) {
  if (!context.userId) {
    throw new Meteor.Error(t('notifications.auth_error_method'))
  }
}
function checkAdminAuthentication(context) {
  if (!context.userId) {
    throw new Meteor.Error(t('notifications.auth_error_method'))
  } else if (!Meteor.users.findOne({ _id: context.userId }).isAdmin) {
    throw new Meteor.Error(t('notifications.auth_error_method'))
  }
}
function getProjectListByCustomer(customer) {
  let projects = []
  const userId = Meteor.userId()

  if (customer === 'all') {
    projects = Projects.find(
      {
        $or: [{ userId }, { public: true }, { team: userId }],
      },
      { _id: 1, name: 1 },
    )
  } else {
    projects = Projects.find(
      {
        customer, $or: [{ userId }, { public: true }, { team: userId }],
      },
      { _id: 1, name: 1 },
    )
  }
  return projects
}

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
    projectId: Projects.findOne({ _id: entry._id.projectId }).name,
    userId: projectUsers
      .findOne().users.find((elem) => elem._id === entry._id.userId)?.profile?.name,
    totalHours,
  }
}

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
    projectId: Projects.findOne({ _id: entry._id.projectId }).name,
    userId: projectUsers.findOne().users
      .find((elem) => elem._id === entry._id.userId)?.profile?.name,
    totalHours,
  }
}
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
  if (customer !== 'all') {
    projectList = getProjectListByCustomer(customer).fetch().map((value) => value._id)
  } else {
    projectList = getProjectListById(projectId)
  }
  if (period && period === 'custom') {
    matchSelector = {
      $match: {
        projectId: { $in: projectList },
        date: { $gte: dates.startDate, $lte: dates.endDate },
      },
    }
    if (userId !== 'all') {
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
    if (userId !== 'all') {
      matchSelector = {
        $match: {
          projectId: { $in: projectList },
          date: { $gte: startDate, $lte: endDate },
          userId,
        },
      }
    }
  } else if (userId === 'all') {
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
function buildDailyHoursSelector(projectId, period, dates, userId, customer, limit, page) {
  let projectList = []
  if (customer !== 'all') {
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
    if (userId === 'all') {
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
    if (userId === 'all') {
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
  } else if (userId === 'all') {
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
    if (userId === 'all') {
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
    if (userId === 'all') {
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
  } else if (userId === 'all') {
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

function buildDetailedTimeEntriesForPeriodSelector({
  projectId, search, customer, period, dates, userId, limit, page, sort,
}) {
  const detailedTimeArray = []
  let projectList = getProjectListById(projectId)
  if (customer !== 'all' && projectId === 'all') {
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
  if (userId !== 'all') {
    query.userId = userId
  }
  detailedTimeArray.push(query)
  detailedTimeArray.push(options)
  return detailedTimeArray
}

export {
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
