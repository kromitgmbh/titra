import { Dashboards } from '../dashboards.js'
import Timecards from '../../timecards/timecards'
import Projects from '../../projects/projects'
/**
 * Publishes the dashboard matching the provided ID.
 * @param {string} _id - The ID of the dashboard to publish.
 * @returns {Mongo.Cursor} The dashboard.
 */
Meteor.publish('dashboardById', async function dashboardById(_id) {
  check(_id, String)
  if (!await Dashboards.findOneAsync({ _id })) {
    return this.ready()
  }
  const dashboard = await Dashboards.findOneAsync({ _id })
  if (dashboard.customer !== 'all') {
    let projectList = await Projects.find(
      {
        customer: dashboard.customer,
      },
      { fields: { _id: 1 } },
    ).fetchAsync()
    projectList = projectList.map((value) => value._id)
    if (dashboard.resourceId.includes('all')) {
      return Timecards.find({
        projectId: { $in: projectList },
        date: { $gte: dashboard.startDate, $lte: dashboard.endDate },
      }, { sort: { date: 1 } })
    }
    return Timecards.find({
      projectId: { $in: projectList },
      userId: dashboard.resourceId,
      date: { $gte: dashboard.startDate, $lte: dashboard.endDate },
    }, { sort: { date: 1 } })
  }
  if (dashboard.resourceId.includes('all')) {
    return Timecards.find({
      projectId: dashboard.projectId,
      date: { $gte: dashboard.startDate, $lte: dashboard.endDate },
    }, { sort: { date: 1 } })
  }
  return Timecards.find({
    projectId: dashboard.projectId,
    userId: dashboard.resourceId,
    date: { $gte: dashboard.startDate, $lte: dashboard.endDate },
  }, { sort: { date: 1 } })
})
/**
 * Publishes the dashboard details matching the provided ID.
 * @param {string} _id - The ID of the dashboard to publish.
 * @returns {Mongo.Cursor} The dashboard details.
 */
Meteor.publish('dashboardByIdDetails', (_id) => {
  check(_id, String)
  return Dashboards.find({ _id })
})
