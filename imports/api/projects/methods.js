import Timecards from '../timecards/timecards'
import Projects from '../projects/projects'

Meteor.methods({
  'getProjectStats'() {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    const stats = []
    for (const project of Projects.find({ userId: this.userId }).fetch()) {
      let hourCount = 0
      for (const timecard of
        Timecards.find({ userId: this.userId, projectId: project._id }).fetch()) {
        hourCount += Number.parseFloat(timecard.hours)
      }
      stats.push({ _id: project._id, name: project.name, hours: hourCount })
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
    }
    updateJSON.userId = this.userId
    Projects.insert(updateJSON)
  },
  'deleteProject'({ projectId }) {
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    Projects.remove({ userId: this.userId, _id: projectId })
    return true
  },
})
