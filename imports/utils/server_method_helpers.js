import i18next from 'i18next'
import moment from 'moment'
import Projects from '../api/projects/projects.js'
import { periodToDates } from './periodHelpers.js'

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
    throw new Meteor.Error(i18next.t('notifications.auth_error_method'))
  }
}
function checkAdminAuthentication(context) {
  if (!context.userId) {
    throw new Meteor.Error(i18next.t('notifications.auth_error_method'))
  } else if (!Meteor.users.findOne({ _id: context.userId }).isAdmin) {
    throw new Meteor.Error(i18next.t('notifications.auth_error_method'))
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
    // const precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
    if (Meteor.user().profile.timeunit === 'd') {
      totalHours = Number(entry.totalHours / (Meteor.user().profile.hoursToDays
        ? Meteor.user().profile.hoursToDays : 8))
    }
  }
  return {
    projectId: Projects.findOne({ _id: entry._id.projectId }).name,
    userId: Meteor.users.findOne({ _id: entry._id.userId }).profile.name,
    totalHours,
  }
}

function dailyTimecardMapper(entry) {
  let { totalHours } = entry
  if (Meteor.user()) {
    // const precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
    if (Meteor.user().profile.timeunit === 'd') {
      totalHours = Number(entry.totalHours / (Meteor.user().profile.hoursToDays
        ? Meteor.user().profile.hoursToDays : 8))
    }
  }
  return {
    date: entry._id.date,
    projectId: Projects.findOne({ _id: entry._id.projectId }).name,
    userId: Meteor.users.findOne({ _id: entry._id.userId }).profile.name,
    totalHours,
  }
}
function buildTotalHoursForPeriodSelector(projectId, period, userId, customer, limit, page) {
  let projectList = []
  const periodArray = []
  let matchSelector = {}
  const groupSelector = {
    $group: {
      _id: { userId: '$userId', projectId: '$projectId' },
      totalHours: { $sum: '$hours' },
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
  if (period && period !== 'all') {
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
  periodArray.push(matchSelector)
  periodArray.push(groupSelector)
  periodArray.push(sortSelector)
  periodArray.push(skipSelector)
  if (limit > 0) {
    periodArray.push(limitSelector)
  }
  return periodArray
}
function buildDailyHoursSelector(projectId, period, userId, customer, limit, page) {
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
  if (period && period !== 'all') {
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
function buildworkingTimeSelector(projectId, period, userId, limit, page) {
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
  if (period && period !== 'all') {
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
  const meteorUser = Meteor.users.findOne({ _id: entry._id.userId })
  const userBreakStartTime = moment(meteorUser.profile.breakStartTime ? meteorUser.profile.breakStartTime : '12:00', 'HH:mm')
  const userBreakDuration = meteorUser.profile.breakDuration ? meteorUser.profile.breakDuration : '0.5'
  const userBreakEndTime = moment(userBreakStartTime, 'HH:mm').add(userBreakDuration, 'Hours')
  const userRegularWorkingTime = meteorUser.profile.regularWorkingTime ? meteorUser.profile.regularWorkingTime : '8'
  const userStartTime = meteorUser.profile.dailyStartTime ? meteorUser.profile.dailyStartTime : '09:00'
  const userEndTime = moment(userStartTime, 'HH:mm').add(entry.totalTime, 'Hours')
  return {
    date: entry._id.date,
    resource: meteorUser.profile.name,
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
  projectId, search, customer, period, userId, limit, page, sort,
}) {
  const detailedTimeArray = []
  let projectList = getProjectListById(projectId)
  if (customer !== 'all') {
    projectList = getProjectListByCustomer(customer).fetch().map((value) => value._id)
  }
  const query = { projectId: { $in: projectList } }
  if (search) {
    query.task = { $regex: `.*${search.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' }
  }
  const options = { sort: {} }
  if (limit) {
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
  if (period !== 'all') {
    const { startDate, endDate } = periodToDates(period)
    query.date = { $gte: startDate, $lte: endDate }
    if (userId !== 'all') {
      query.userId = userId
    }
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
