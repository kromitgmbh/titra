import moment from 'moment'
import csv from 'fast-csv'
import Timecards from './timecards.js'
import Tasks from '../tasks/tasks.js'

Meteor.methods({
  'insertTimeCard'({ projectId, task, date, hours }) {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    if (!Tasks.findOne({ userId: this.userId, name: task })) {
      Tasks.insert({ userId: this.userId, name: task })
    }
    Timecards.insert({ userId: this.userId, projectId, date, hours, task })
  },
  'export'({ projectId, timePeriod }) {
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
    return new Promise((resolve, reject) => {
      csv.writeToString(Timecards.find({ userId: this.userId,
        projectId,
        date: { $gte: startDate, $lte: endDate } }).fetch(), { headers: true, delimiter: '\t' }, (error, data) => {
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
  'deleteTimeCard'({ timecardId }) {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    Timecards.remove({ userId: this.userId, _id: timecardId })
    return true
  },
})
