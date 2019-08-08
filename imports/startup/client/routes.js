import { FlowRouter } from 'meteor/kadira:flow-router'
import { BlazeLayout } from 'meteor/kadira:blaze-layout'
import { AccountsTemplates } from 'meteor/useraccounts:core'
import '../../ui/layouts/appLayout.js'
import '../../ui/pages/tracktime.js'
import '../../ui/pages/projectlist.js'
import '../../ui/pages/timecardlist.js'
import '../../ui/pages/editproject.js'
import '../../ui/pages/settings.js'
import '../../ui/pages/dashboard.js'
import '../../ui/pages/404.html'

if (!Meteor.settings.public.sandstorm) {
  FlowRouter.triggers.enter([AccountsTemplates.ensureSignedIn], { except: ['dashboard'] })
}
FlowRouter.route('/', {
  action() {
    document.title = 'titra - overview'
    BlazeLayout.render('appLayout', { main: 'projectlist' })
  },
  name: 'projectlist',
})
FlowRouter.route('/tracktime/:projectId?', {
  action() {
    document.title = 'titra - track time'
    BlazeLayout.render('appLayout', { main: 'tracktimemain' })
  },
  name: 'tracktime',
})
FlowRouter.route('/edit/timecard/:tcid', {
  action() {
    document.title = 'titra - edit time'
    BlazeLayout.render('appLayout', { main: 'tracktime' })
  },
  name: 'edittime',
})
FlowRouter.route('/list/projects', {
  action() {
    document.title = 'titra - overview'
    BlazeLayout.render('appLayout', { main: 'projectlist' })
  },
  name: 'projectlist',
})
FlowRouter.route('/edit/project/:id', {
  action() {
    document.title = 'titra - edit project'
    BlazeLayout.render('appLayout', { main: 'editproject' })
  },
  name: 'editproject',
})
FlowRouter.route('/create/project/', {
  action() {
    document.title = 'titra - create project'
    BlazeLayout.render('appLayout', { main: 'editproject' })
  },
  name: 'createProject',
})
FlowRouter.route('/list/timecards/:projectId', {
  action() {
    document.title = 'titra - details'
    BlazeLayout.render('appLayout', { main: 'timecardlist' })
  },
  name: 'timecards',
})
FlowRouter.route('/settings', {
  action() {
    document.title = 'titra - settings'
    BlazeLayout.render('appLayout', { main: 'settings' })
  },
  name: 'settings',
})
FlowRouter.route('/dashboard/:_id', {
  action() {
    document.title = 'titra - dashboard'
    BlazeLayout.render('appLayout', { main: 'dashboard' })
  },
  name: 'dashboard',
})
FlowRouter.route('/404', {
  action() {
    BlazeLayout.render('appLayout', { main: '404' })
  },
  name: '404',
})
FlowRouter.notFound = {
  action: () => {
    BlazeLayout.render('appLayout', { main: '404' })
  },
}
AccountsTemplates.configureRoute('signIn', {
  name: 'signin',
  path: '/signin',
})
AccountsTemplates.configureRoute('signUp', {
  name: 'join',
  path: '/join',
})
AccountsTemplates.configureRoute('changePwd', {
  name: 'changePwd',
  path: '/changePwd',
})
