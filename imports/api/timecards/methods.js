import moment from 'moment'
import csv from 'fast-csv'
import emoji from 'node-emoji'
import Timecards from './timecards.js'
import Tasks from '../tasks/tasks.js'
import Projects from '../projects/projects.js'

const replacer = match => emoji.emojify(match)

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
})
