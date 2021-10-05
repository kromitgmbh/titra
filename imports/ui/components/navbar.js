import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { displayUserAvatar, getUserSetting } from '../../utils/frontend_helpers'

import './navbar.html'
import './timetracker'

Template.navbar.onCreated(function navbarCreated() {
  this.autorun(() => {
    if (Meteor.user()) {
      this.subscribe('userRoles')
    }
  })
})

Template.navbar.helpers({
  isRouteActive: (routename) => (FlowRouter.getRouteName() === routename ? 'active' : ''),
  displayLinkText: (routename) => (FlowRouter.getRouteName() === routename),
  avatar: () => displayUserAvatar(Meteor.user()),
  getUserSetting: (setting) => getUserSetting(setting),
})
