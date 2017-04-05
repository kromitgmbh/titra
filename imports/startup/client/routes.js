import { FlowRouter } from 'meteor/kadira:flow-router'
import { BlazeLayout } from 'meteor/kadira:blaze-layout'
import { AccountsTemplates } from 'meteor/useraccounts:core'
import '../../ui/layouts/appLayout.js'
import '../../ui/pages/tracktime.js'
import '../../ui/pages/projectlist.js'
import '../../ui/pages/timecardlist.js'
import '../../ui/pages/editproject.js'
import '../../ui/pages/settings.js'


// import '../../ui/pages/root-redirector.js';
// import '../../ui/pages/lists-show-page.js';
// import '../../ui/pages/app-not-found.js';

// Import to override accounts templates
// import '../../ui/accounts/accounts-templates.js';
if (!Meteor.settings.public.sandstorm) {
  FlowRouter.triggers.enter([AccountsTemplates.ensureSignedIn])
}
FlowRouter.route('/', {
  action() {
    BlazeLayout.render('appLayout', { main: 'projectlist' })
  },
  name: 'projectlist',
})
FlowRouter.route('/tracktime/:projectId?', {
  action() {
    BlazeLayout.render('appLayout', { main: 'tracktime' })
  },
  name: 'tracktime',
})
FlowRouter.route('/edit/timecard/:tcid', {
  action() {
    BlazeLayout.render('appLayout', { main: 'tracktime' })
  },
  name: 'edittime',
})
FlowRouter.route('/list/projects', {
  action() {
    BlazeLayout.render('appLayout', { main: 'projectlist' })
  },
  name: 'projectlist',
})
FlowRouter.route('/edit/project/:id', {
  action() {
    BlazeLayout.render('appLayout', { main: 'editproject' })
  },
  name: 'editproject',
})
FlowRouter.route('/create/project/', {
  action() {
    BlazeLayout.render('appLayout', { main: 'editproject' })
  },
  name: 'createProject',
})
FlowRouter.route('/list/timecards/:projectId', {
  action() {
    BlazeLayout.render('appLayout', { main: 'timecardlist' })
  },
  name: 'timecards',
})
FlowRouter.route('/settings', {
  action() {
    BlazeLayout.render('appLayout', { main: 'settings' })
  },
  name: 'settings',
})
AccountsTemplates.configureRoute('signIn', {
  name: 'signin',
  path: '/signin',
})
AccountsTemplates.configureRoute('signUp', {
  name: 'join',
  path: '/join',
})
