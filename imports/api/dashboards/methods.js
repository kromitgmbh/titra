import { Dashboards } from './dashboards'
import { periodToDates } from '../../utils/periodHelpers.js'
import { checkAuthentication } from '../../utils/server_method_helpers.js'
import { getGlobalSetting } from '../../utils/frontend_helpers'

Meteor.methods({
  addDashboard({
    projectId, resourceId, customer, timePeriod,
  }) {
    check(projectId, String)
    check(timePeriod, String)
    check(resourceId, String)
    check(customer, String)
    checkAuthentication(this)
    const { startDate, endDate } = periodToDates(timePeriod)
    const meteorUser = Meteor.users.findOne({ _id: this.userId })
    let timeunit = getGlobalSetting('timeunit')
    let hoursToDays = getGlobalSetting('hoursToDays')
    if (meteorUser.profile.timeunit) {
      timeunit = meteorUser.profile.timeunit
    }
    if (meteorUser.profile.hoursToDays) {
      hoursToDays = meteorUser.profile.hoursToDays
    }
    const _id = Random.id()
    Dashboards.insert({
      _id, projectId, customer, startDate, endDate, resourceId, timeunit, hoursToDays,
    })
    return _id
  },
})
