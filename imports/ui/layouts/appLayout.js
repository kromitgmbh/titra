import { FlowRouter } from 'meteor/kadira:flow-router'
import { Template } from 'meteor/templating'
import Notifications from '../../api/notifications/notifications.js'
import './appLayout.html'
import '../components/navbar.js'
import '../components/connectioncheck.js'

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
      $.notify(Notifications.findOne().message)
    }
  })
})
