import Timecards from '../../timecards/timecards.js'
import Projects from '../../projects/projects.js'

Meteor.publish('projectUsers', function projectUsers({ projectId }) {
  check(projectId, String)
  const userIds = []
  const projectList = Projects.find({ $or: [{ userId: this.userId }, { public: true }] },
    { _id: 1 }).fetch().map(value => value._id)
  if (Timecards.find({ projectId: { $in: projectList } }).count() <= 0) {
    return this.ready()
  }
  Timecards.find({ projectId: { $in: projectList } }).forEach((timecard) => {
    userIds.push(timecard.userId)
  })
  const uniqueUsers = [...new Set(userIds)]
  return Meteor.users.find({ _id: { $in: uniqueUsers } })
})
