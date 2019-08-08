import Projects from '../api/projects/projects.js'
import { periodToDates } from './periodHelpers.js'

function getProjectListById(projectId) {
  let projectList = []
  if (projectId === 'all') {
    projectList = Projects.find(
      {
        $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
      },
      { $fields: { _id: 1 } },
    ).fetch().map(value => value._id)
  } else {
    projectList = [projectId]
  }
  return projectList
}
function checkAuthentication(context) {
  if (!context.userId) {
    throw new Meteor.Error('You have to be signed in to use this method.')
  }
}
function getProjectListByCustomer(customer) {
  let projects = []
  if (customer === 'all') {
    projects = Projects.find(
      {
        $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
      },
      { _id: 1, name: 1 },
    )
  } else {
    projects = Projects.find(
      {
        customer, $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
      },
      { _id: 1, name: 1 },
    )
  }
  return projects
}

function totalHoursForPeriodMapper(entry) {
  return {
    projectId: Projects.findOne({ _id: entry._id.projectId }).name,
    userId: Meteor.users.findOne({ _id: entry._id.userId }).profile.name,
    totalHours: entry.totalHours,
  }
}

function dailyTimecardMapper(entry) {
  return {
    projectId: Projects.findOne({ _id: entry._id.projectId }).name,
    userId: Meteor.users.findOne({ _id: entry._id.userId }).profile.name,
    date: entry._id.date,
    totalHours: entry.totalHours,
  }
}
function buildTotalHoursForPeriodSelector(projectId, period, userId, customer, limit) {
  let projectList = []
  const periodArray = []
  let matchSelector = {}
  const groupSelector = {
    $group: {
      _id: { userId: '$userId', projectId: '$projectId' },
      totalHours: { $sum: '$hours' },
    },
  }
  const limitSelector = {
    $limit: limit,
  }
  if (customer !== 'all') {
    projectList = getProjectListByCustomer(customer).fetch().map(value => value._id)
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
  if (limit > 0) {
    periodArray.push(limitSelector)
  }
  return periodArray
}
function buildDailyHoursSelector(projectId, period, userId, customer, limit) {
  let projectList = []
  if (customer !== 'all') {
    projectList = getProjectListByCustomer(customer).fetch().map(value => value._id)
  } else {
    projectList = getProjectListById(projectId)
  }
  const dailyArray = []
  let matchSelector = {}
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
  if (limit > 0) {
    dailyArray.push(limitSelector)
  }
  return dailyArray
}
export {
  checkAuthentication,
  getProjectListById,
  getProjectListByCustomer,
  totalHoursForPeriodMapper,
  dailyTimecardMapper,
  buildTotalHoursForPeriodSelector,
  buildDailyHoursSelector,
}
