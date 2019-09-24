import { Dashboards } from '../dashboards.js'
import Timecards from '../../timecards/timecards'
import Projects from '../../projects/projects'

Meteor.publish('dashboardById', function dashboardById(_id) {
  check(_id, String)
  if (!Dashboards.findOne({ _id })) {
    return this.ready()
  }
  const dashboard = Dashboards.findOne({ _id })
  if (dashboard.customer !== 'all') {
    const projectList = Projects.find(
      {
        customer: dashboard.customer,
      },
      { $fields: { _id: 1 } },
    ).fetch().map((value) => value._id)
    if (dashboard.resourceId === 'all') {
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
  if (dashboard.resourceId === 'all') {
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
Meteor.publish('dashboardByIdDetails', (_id) => {
  check(_id, String)
  return Dashboards.find({ _id })
})
