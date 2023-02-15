import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { Template } from 'meteor/templating'
import Notifications from '../../api/notifications/notifications.js'
import { showToast } from '../../utils/frontend_helpers.js'
import './appLayout.html'
import '../shared components/navbar.js'
import '../shared components/connectioncheck.js'
import '../shared components/toast.html'

Template.appLayout.events({
  'click #logout': (event) => {
    event.preventDefault()
    Meteor.logout()
    FlowRouter.go('signin')
  },
})

Template.appLayout.onRendered(function appLayoutRendered() {
  this.subscribe('mynotifications')
  this.autorun(() => {
    if (this.subscriptionsReady()
    && Meteor.userId() && Notifications.findOne({ userId: Meteor.userId() })) {
      showToast(Notifications.findOne().message)
    }
  })
})
