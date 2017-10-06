import moment from 'moment'
import Timecards from '../timecards.js'
import Projects from '../../projects/projects.js'

Meteor.publish('projectTimecards', function projectTimecards({ projectId, period, userId }) {
  // console.log(projectId)
  let projectList = []
  if (projectId === 'all') {
    projectList = Projects.find(
      {
        $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
      },
      { $fields: { _id: 1 } },
    ).fetch().map(value => value._id)
  } else {
    projectList = [Projects.findOne({ _id: projectId })._id]
  }
  // const project = Projects.findOne({ _id: { $in: projectList } })
  // if (!this.userId || (!Timecards.findOne({ projectId, userId: this.userId })) {
  //   return this.ready()
  // }
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
    if (userId === 'all') {
      return Timecards.find({ projectId: { $in: projectList },
        date: { $gte: startDate, $lte: endDate } })
    }
    return Timecards.find({ projectId: { $in: projectList },
      userId,
      date: { $gte: startDate, $lte: endDate } })
  }
  if (userId === 'all') {
    return Timecards.find({ projectId: { $in: projectList } })
  }
  return Timecards.find({ projectId: { $in: projectList }, userId })
})

Meteor.publish('periodTimecards', function periodTimecards({ startDate, endDate, userId }) {
  const projectList = Projects.find({ $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
    { $fields: { _id: 1 } }).fetch().map(value => value._id)

  if (userId === 'all') {
    return Timecards.find({ projectId: { $in: projectList },
      date: { $gte: startDate, $lte: endDate } })
  }
  return Timecards.find({ projectId: { $in: projectList },
    userId,
    date: { $gte: startDate, $lte: endDate } })
})

Meteor.publish('singleTimecard', function singleTimecard(_id) {
  check(_id, String)
  const timecard = Timecards.findOne({ _id })
  const project = Projects.findOne({ _id: timecard.projectId })
  if (!this.userId || (!Timecards.findOne({ userId: this.userId }) && !project.public)) {
    return this.ready()
  }
  return Timecards.find({ _id })
})
