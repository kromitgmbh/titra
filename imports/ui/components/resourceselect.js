import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './resourceselect.html'
import projectUsers from '../../api/users/users.js'

Template.resourceselect.onCreated(function createResourceSelect() {
  this.resources = new ReactiveVar()
  this.autorun(() => {
    if (Template.currentData().get()) {
      this.subscribe('projectUsers', { projectId: Template.currentData().get() })
    }
  })
})

Template.resourceselect.helpers({
  resources() {
    return projectUsers.findOne({ _id: Template.currentData().get() })
      ? projectUsers.findOne({ _id: Template.currentData().get() }).users
        .sort((a, b) => {
          if (a.profile.name < b.profile.name) {
            return -1
          }
          if (a.profile.name > b.profile.name) {
            return 1
          }
          return 0
        }) : false
  },
  selected(_id) {
    return _id === FlowRouter.getQueryParam('resource') ? 'selected' : false
  },
})
Template.resourceselect.onRendered(() => {
  Template.instance().autorun(() => {
    if (FlowRouter.getQueryParam('resource') && Template.instance().subscriptionsReady()) {
      Template.instance().$('#resourceselect').val(FlowRouter.getQueryParam('resource'))
    }
  })
})
