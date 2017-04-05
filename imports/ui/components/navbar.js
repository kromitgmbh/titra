import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/kadira:flow-router'
import './navbar.html'

Template.navbar.onRendered(() => {
})

Template.navbar.helpers({
  sandStormUser: () => Meteor.settings.public.sandstorm,
  isRouteActive: routename => (FlowRouter.getRouteName() === routename ? 'active' : ''),
})

Template.navbar.events({
  'click .js-logout': (event) => {
    event.preventDefault()
    Meteor.logout()
  },
})
