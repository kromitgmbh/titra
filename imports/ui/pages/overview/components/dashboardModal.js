import bootstrap from 'bootstrap'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { t } from '../../../../utils/i18n'
import { showToast } from '../../../../utils/frontend_helpers'
import Projects from '../../../../api/projects/projects'
import '../../details/components/periodpicker.js'
import './dashboardModal.html'

Template.dashboardModal.onCreated(function dashboardModalCreated() {
  this.subscribe('myprojects', {})
  this.dashboardId = new ReactiveVar(null)
})

Template.dashboardModal.onRendered(() => {
})

Template.dashboardModal.helpers({
  projects() {
    return Projects.find(
      { $or: [{ archived: { $exists: false } }, { archived: false }] },
      { sort: { priority: 1, name: 1 } },
    )
  },
  dashboardId() {
    return Template.instance().dashboardId.get()
  },
  selectedProjectName() {
    const project = Projects.findOne({ _id: Template.instance().data.projectId.get() })
    if (project) {
      return project.name
    }
    return ''
  },
  dashboardURL() {
    const dashboardId = Template.instance().dashboardId.get()
    if (dashboardId) {
      return FlowRouter.url('dashboard', { _id: dashboardId })
    }
    return ''
  },
})

Template.dashboardModal.events({
  'click .js-create-dashboard': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('addDashboard', {
      projectId: templateInstance.data.projectId.get(), resourceId: 'all', customer: 'all', timePeriod: templateInstance.$('#period').val(),
    }, (error, _id) => {
      if (error) {
        showToast(t('notifications.dashboard_creation_failed'))
      } else {
        templateInstance.dashboardId.set(_id)
      }
    })
  },
})
