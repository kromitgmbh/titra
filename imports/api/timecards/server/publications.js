import moment from 'moment'
import Timecards from '../timecards.js'

Meteor.publish('projectTimecards', function projectTimecards({ projectId, period }) {
  if (!this.userId || !Timecards.findOne({ projectId,
    $or: [{ userId: this.userId }, { public: true }] })) {
    return this.ready()
  }
  if (period && period !== 'all') {
    let startDate
    let endDate
    switch (period) {
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
    return Timecards.find({ userId: this.userId,
      projectId,
      date: { $gte: startDate, $lte: endDate } })
  }
  return Timecards.find({ projectId, userId: this.userId })
})
Meteor.publish('singleTimecard', function singleTimecard(_id) {
  check(_id, String)
  if (!this.userId || !Timecards.findOne({ $or: [{ userId: this.userId }, { public: true }] })) {
    return this.ready()
  }
  return Timecards.find({ _id })
})
