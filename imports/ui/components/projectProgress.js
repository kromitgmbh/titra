import './projectProgress.html'

import hex2rgba from '../../utils/hex2rgba.js'
import { ProjectStats } from '../../api/projects/projects.js'
import { getGlobalSetting } from '../../utils/frontend_helpers'

Template.projectProgress.onCreated(function projectProgressCreated() {
  this.autorun(() => {
    this.subscribe('singleProject', Template.currentData()._id)
    this.subscribe('projectStats', Template.currentData()._id)
  })
})
Template.projectProgress.helpers({
  totalHours() {
    let precision = getGlobalSetting('precision')
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : getGlobalSetting('precision')
    }
    const projectStats = ProjectStats.findOne({ _id: Template.currentData()._id })
    return projectStats
      ? Number(projectStats.totalHours).toFixed(precision)
      : false
  },
  percentage() {
    const projectStats = ProjectStats.findOne({ _id: Template.currentData()._id })
    return projectStats
      ? Number(projectStats.totalHours * 100 / Template.currentData().target)
        .toFixed(0) : false
  },
  target() {
    return Template.instance().subscriptionsReady() && Number(Template.currentData().target) > 0
      ? Template.currentData().target : false
  },
  colorOpacity(hex, op) {
    return hex2rgba(hex || '#009688', !isNaN(op) ? op : 50)
  },
})
