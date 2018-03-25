import moment from 'moment'
import csv from 'fast-csv'
import emoji from 'node-emoji'
import { HTTP } from 'meteor/http'
import Timecards from './timecards.js'
import Tasks from '../tasks/tasks.js'
import Projects from '../projects/projects.js'

const replacer = match => emoji.emojify(match)
function timeInUserUnit(time, meteorUser) {
  const precision = meteorUser.profile.precision ? meteorUser.profile.precision : 2
  if (meteorUser.profile.timeunit === 'd') {
    const convertedTime = Number(time / (meteorUser.profile.hoursToDays
      ? meteorUser.profile.hoursToDays : 8)).toFixed(precision)
    return convertedTime !== Number(0).toFixed(precision) ? convertedTime : undefined
  }
  return Number(time).toFixed(precision)
}

Meteor.methods({
  insertTimeCard({
    projectId,
    task,
    date,
    hours,
  }) {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    if (!Tasks.findOne({ userId: this.userId, name: task.replace(/(:.*:)/g, replacer) })) {
      Tasks.insert({ userId: this.userId, name: task.replace(/(:.*:)/g, replacer) })
    }
    Timecards.insert({
      userId: this.userId,
      projectId,
      date,
      hours,
      task: task.replace(/(:.*:)/g, replacer),
    })
  },
  updateTimeCard({
    projectId,
    _id,
    task,
    date,
    hours,
  }) {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    if (!Tasks.findOne({ userId: this.userId, name: task.replace(/(:.*:)/g, replacer) })) {
      Tasks.insert({ userId: this.userId, name: task.replace(/(:.*:)/g, replacer) })
    }
    Timecards.update({ _id }, {
      $set: {
        projectId,
        date,
        hours,
        task: task.replace(/(:.*:)/g, replacer),
      },
    })
  },
  export({ projectId, timePeriod, userId }) {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    let startDate
    let endDate
    switch (timePeriod) {
      default:
        startDate = moment().startOf('month').toDate()
        endDate = moment().endOf('month').toDate()
        break
      case 'currentWeek':
        startDate = moment().startOf('week').toDate()
        endDate = moment().endOf('week').toDate()
        break
      case 'lastMonth':
        startDate = moment().subtract(1, 'month').startOf('month').toDate()
        endDate = moment().subtract(1, 'month').endOf('month').toDate()
        break
      case 'lastWeek':
        startDate = moment().subtract(1, 'week').startOf('week').toDate()
        endDate = moment().subtract(1, 'week').endOf('week').toDate()
        break
    }
    let timecardArray = []
    let projectList = []
    if (projectId === 'all') {
      projectList = Projects.find(
        {
          $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
        },
        { _id: 1 },
      ).fetch().map(value => value._id)
    } else {
      projectList = [projectId]
    }
    if (userId !== 'all') {
      timecardArray = Timecards.find({
        userId,
        projectId: { $in: projectList },
        date: { $gte: startDate, $lte: endDate },
      }).fetch()
    } else {
      timecardArray = Timecards.find({
        projectId: { $in: projectList },
        date: { $gte: startDate, $lte: endDate },
      }).fetch()
    }
    for (const timecard of timecardArray) {
      timecard.date = moment(timecard.date).format('DD.MM.YYYY')
      timecard.Resource = Meteor.users.findOne({ _id: timecard.userId }).profile.name
      timecard.Project = Projects.findOne({ _id: timecard.projectId }).name
      delete timecard.userId
      delete timecard.projectId
      delete timecard._id
    }
    return new Promise((resolve, reject) => {
      csv.writeToString(timecardArray, { headers: true, delimiter: '\t' }, (error, data) => {
        if (error) {
          reject(error)
        } else {
          resolve(data)
        }
      })
    })
    // return new Buffer(json2xls(Timecards.find({ userId: this.userId,
    //   projectId,
    //   date: { $gte: startDate, $lte: endDate } }).fetch())).toString('base64')
  },
  deleteTimeCard({ timecardId }) {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    Timecards.remove({ userId: this.userId, _id: timecardId })
    return true
  },
  sendToSiwapp({ projectId, timePeriod, userId }) {
    check(projectId, String)
    check(timePeriod, String)
    check(userId, String)
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    const meteorUser = Meteor.users.findOne({ _id: this.userId })
    if (!meteorUser.profile.siwappurl || !meteorUser.profile.siwapptoken) {
      throw new Meteor.Error('You need to set the siwapp URL & token first.')
    }
    let startDate
    let endDate
    switch (timePeriod) {
      default:
        startDate = moment().startOf('month').toDate()
        endDate = moment().endOf('month').toDate()
        break
      case 'currentWeek':
        startDate = moment().startOf('week').toDate()
        endDate = moment().endOf('week').toDate()
        break
      case 'lastMonth':
        startDate = moment().subtract(1, 'month').startOf('month').toDate()
        endDate = moment().subtract(1, 'month').endOf('month').toDate()
        break
      case 'lastWeek':
        startDate = moment().subtract(1, 'week').startOf('week').toDate()
        endDate = moment().subtract(1, 'week').endOf('week').toDate()
        break
    }
    const projectMap = new Map()
    if (projectId === 'all') {
      Projects.find(
        {
          $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
        },
        { _id: 1, name: 1 },
      ).forEach((project) => {
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
          issue_date: moment().format('YYYY-MM-DD'),
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
})
