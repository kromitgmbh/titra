import { Dashboards } from './dashboards'
import { periodToDates } from '../../utils/periodHelpers.js'
import { checkAuthentication } from '../../utils/server_method_helpers.js'

Meteor.methods({
  addDashboard({
    projectId, resourceId, customer, timePeriod,
  }) {
    if (!this.userId) {
      throw new Meteor.Error('sorry, you have to be logged in to use this method')
    }
    check(projectId, String)
    check(timePeriod, String)
    check(resourceId, String)
    check(customer, String)
    checkAuthentication(this)
    const { startDate, endDate } = periodToDates(timePeriod)
    const meteorUser = Meteor.users.findOne({ _id: this.userId })
    let timeunit = 'h'
    let hoursToDays = 8
    if (meteorUser.profile.timeunit) {
      ({ timeunit } = meteorUser.profile.timeunit)
    }
    if (meteorUser.profile.hoursToDays) {
      ({ hoursToDays } = meteorUser.profile.hoursToDays)
    }
    const _id = Random.id()
    Dashboards.insert({
      _id, projectId, customer, startDate, endDate, resourceId, timeunit, hoursToDays,
    })
    return _id
  },
})
