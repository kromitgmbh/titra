// import Timecards from '../timecards/timecards.js'
// import Projects from '../projects/projects.js'

Meteor.methods({
  // getResourcesInProject({ projectId }) {
  //   // const project = Projects.findOne({ _id: projectId })
  //   const userIds = []
  //   for (const timecard of Timecards.find({ projectId }).fetch()) {
  //     userIds.push(timecard.userId)
  //   }
  //   const uniqueUsers = [...new Set(userIds)]
  //   return Meteor.users.find({ _id: { $in: uniqueUsers } }, { 'profile.name': 1 }).fetch()
  // },
  updateSettings({ name, unit, timeunit, timetrackview }) {
    check(name, String)
    check(unit, String)
    check(timeunit, String)
    check(timetrackview, String)
    Meteor.users.update({ _id: this.userId }, { $set: { 'profile.name': name, 'profile.unit': unit, 'profile.timeunit': timeunit, 'profile.timetrackview': timetrackview } })
  },
})
