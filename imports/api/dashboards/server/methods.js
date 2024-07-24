import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { Dashboards } from '../dashboards'
import { periodToDates } from '../../../utils/periodHelpers.js'
import { authenticationMixin, transactionLogMixin, getGlobalSettingAsync } from '../../../utils/server_method_helpers.js'

/**
 * Adds a dashboard.
 *
 * @param {Object} args - The arguments to use when adding the dashboard.
 * @param {string} args.projectId - The ID of the project to associate with the dashboard.
 * @param {string} args.resourceId - The ID of the resource to associate with the dashboard.
 * @param {string} args.customer - The customer to associate with the dashboard.
 * @param {string} args.timePeriod - The time period to associate with the dashboard.
 *
 * @return {Promise} - A promise that resolves to the ID of the added dashboard.
 */
const addDashboard = new ValidatedMethod({
  name: 'addDashboard',
  validate(args) {
    check(args, {
      projectId: String,
      resourceId: String,
      customer: String,
      timePeriod: String,
    })
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run({
    projectId, resourceId, customer, timePeriod,
  }) {
    const { startDate, endDate } = await periodToDates(timePeriod)
    const meteorUser = await Meteor.users.findOneAsync({ _id: this.userId })
    let timeunit = await getGlobalSettingAsync('timeunit')
    let hoursToDays = await getGlobalSettingAsync('hoursToDays')
    if (meteorUser.profile.timeunit) {
      timeunit = meteorUser.profile.timeunit
    }
    if (meteorUser.profile.hoursToDays) {
      hoursToDays = meteorUser.profile.hoursToDays
    }
    const _id = Random.id()
    await Dashboards.insertAsync({
      _id, projectId, customer, startDate, endDate, resourceId, timeunit, hoursToDays,
    })
    return _id
  },
})

export { addDashboard }
