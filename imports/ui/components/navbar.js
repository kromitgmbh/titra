import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { displayUserAvatar } from '../../utils/frontend_helpers'

import './navbar.html'

Template.navbar.onCreated(function navbarCreated() {
  this.subscribe('userRoles')
})

Template.navbar.helpers({
  isRouteActive: (routename) => (FlowRouter.getRouteName() === routename ? 'active' : ''),
  displayLinkText: (routename) => (FlowRouter.getRouteName() === routename),
  avatar: () => displayUserAvatar(Meteor.user()),
})
