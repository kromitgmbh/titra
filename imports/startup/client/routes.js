import { FlowRouter } from 'meteor/kadira:flow-router'
import { BlazeLayout } from 'meteor/kadira:blaze-layout'
import { AccountsTemplates } from 'meteor/useraccounts:core'
import '../../ui/layouts/appLayout.js'
import '../../ui/pages/home.js'
import '../../ui/pages/tracktime.js'

// import '../../ui/pages/root-redirector.js';
// import '../../ui/pages/lists-show-page.js';
// import '../../ui/pages/app-not-found.js';

// Import to override accounts templates
// import '../../ui/accounts/accounts-templates.js';

FlowRouter.triggers.enter([AccountsTemplates.ensureSignedIn])

FlowRouter.route('/', {
  action() {
    BlazeLayout.render('appLayout', { main: 'home' })
  },
  name: 'home',
})
FlowRouter.route('/tracktime', {
  action() {
    BlazeLayout.render('appLayout', { main: 'tracktime' })
  },
  name: 'tracktime',
})
AccountsTemplates.configureRoute('signIn', {
  name: 'signin',
  path: '/signin',
})
AccountsTemplates.configureRoute('signUp', {
  name: 'join',
  path: '/join',
})
