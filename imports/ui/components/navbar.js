import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/kadira:flow-router'
import './navbar.html'

Template.navbar.onRendered(() => {
})

Template.navbar.helpers({
  isRouteActive: routename => (FlowRouter.getRouteName() === routename ? 'active' : ''),
})
