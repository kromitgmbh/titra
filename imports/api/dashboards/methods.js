import { Dashboards } from './dashboards'

Meteor.methods({
  addDashboard({
    projectId, startDate, endDate, resourceId,
  }) {
    if (!this.userId) {
      throw new Meteor.Error('sorry, you have to be logged in to use this method')
    }
    check(projectId, String)
    check(startDate, Date)
    check(endDate, Date)
    check(resourceId, String)
    const meteorUser = Meteor.users.findOne({ _id: this.userId })
    let timeunit = 'h'
    let hoursToDays = 8
    if (meteorUser.profile.timeunit) {
      timeunit = meteorUser.profile.timeunit
    }
    if (meteorUser.profile.hoursToDays) {
      hoursToDays = meteorUser.profile.hoursToDays
    }
    const _id = Random.id()
    Dashboards.insert({
      _id, projectId, startDate, endDate, resourceId, timeunit, hoursToDays,
    })
    return _id
  },
})
