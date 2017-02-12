import Timecards from '../../timecards/timecards.js'

Meteor.publish('projectUsers', function projectUsers(param) {
  check(param, Object)
  check(param.projectId, String)
  const userIds = []
  if (Timecards.find({ projectId: param.projectId }).count() <= 0) {
    return this.ready()
  }
  Timecards.find({ projectId: param.projectId }).forEach((timecard) => {
    userIds.push(timecard.userId)
  })
  const uniqueUsers = [...new Set(userIds)]
  return Meteor.users.find({ _id: { $in: uniqueUsers } })
})
