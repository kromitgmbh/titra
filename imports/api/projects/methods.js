import moment from 'moment'
import Timecards from '../timecards/timecards'
import Projects from '../projects/projects'

Meteor.methods({
  'getProjectStats'() {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    const stats = []
    for (const project of Projects.find({ userId: this.userId }).fetch()) {
      let totalHours = 0
      let currentMonthHours = 0
      let previousMonthHours = 0
      const currentMonthStart = moment().startOf('month')
      const currentMonthEnd = moment().endOf('month')
      const previousMonthStart = moment().startOf('month')
      const previousMonthEnd = moment().endOf('month')

      for (const timecard of
        Timecards.find({ userId: this.userId, projectId: project._id }).fetch()) {
        if (moment(new Date(timecard.date)).isBetween(currentMonthStart, currentMonthEnd)) {
          currentMonthHours += Number.parseFloat(timecard.hours)
        }
        if (moment(new Date(timecard.date)).isBetween(previousMonthStart, previousMonthEnd)) {
          previousMonthHours += Number.parseFloat(timecard.hours)
        }
        totalHours += Number.parseFloat(timecard.hours)
      }
      stats.push({ _id: project._id,
        name: project.name,
        totalHours,
        currentMonthHours,
        previousMonthHours,
      })
    }
    return stats
  },
  'updateProject'({ projectId, projectArray }) {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    const updateJSON = {}
    for (const projectAttribute of projectArray) {
      updateJSON[projectAttribute.name] = projectAttribute.value
    }
    if (!updateJSON.public) {
      updateJSON.public = false
    } else {
      updateJSON.public = true
    }
    Projects.update({ userId: this.userId, _id: projectId }, { $set: updateJSON })
  },
  'createProject'({ projectArray }) {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    const updateJSON = {}
    for (const projectAttribute of projectArray) {
      updateJSON[projectAttribute.name] = projectAttribute.value
    }
    if (!updateJSON.public) {
      updateJSON.public = false
    } else {
      updateJSON.public = true
    }
    updateJSON.userId = this.userId
    Projects.insert(updateJSON)
  },
  'deleteProject'({ projectId }) {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    check(projectId, String)
    Projects.remove({ $or: [{ userId: this.userId }, { public: true }], _id: projectId })
    return true
  },
  'getTopTasks'({ projectId }) {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    const rawCollection = Timecards.rawCollection()
    const aggregate = Meteor.wrapAsync(rawCollection.aggregate, rawCollection)
    return aggregate([{ $match: { projectId } }, { $group: { _id: '$task', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 3 }])
  },
})
