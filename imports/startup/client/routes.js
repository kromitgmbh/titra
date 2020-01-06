import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { AccountsAnonymous } from 'meteor/brettle:accounts-anonymous'
import '../../ui/layouts/appLayout.js'
import '../../ui/pages/signIn.js'
import '../../ui/pages/register.js'
import '../../ui/pages/changePassword.js'
import '../../ui/pages/404.html'

if (!Meteor.settings.public.sandstorm) {
  FlowRouter.triggers.enter([(context, redirect) => {
    if (!Meteor.loggingIn() && !Meteor.user()) {
      redirect('/signIn')
    }
  }], { except: ['dashboard', 'signIn', 'changePassword', 'register', 'reset-password', 'try'] })
}
FlowRouter.route('*', {
  action: () => {
    this.render('appLayout', '404')
  },
})
FlowRouter.route('/', {
  waitOn() {
    return import('../../ui/pages/projectlist.js')
  },
  action() {
    document.title = 'titra - overview'
    this.render('appLayout', 'projectlist')
  },
  name: 'projectlist',
})
FlowRouter.route('/tracktime/:projectId?', {
  waitOn() {
    return import('../../ui/pages/tracktime.js')
  },
  action() {
    document.title = 'titra - track time'
    this.render('appLayout', 'tracktimemain')
  },
  name: 'tracktime',
})
FlowRouter.route('/edit/timecard/:tcid', {
  waitOn() {
    return import('../../ui/pages/tracktime.js')
  },
  action() {
    document.title = 'titra - edit time'
    this.render('appLayout', 'tracktime')
  },
  name: 'edittime',
})
FlowRouter.route('/list/projects', {
  waitOn() {
    return [import('../../api/timecards/tabular.js'), import('../../ui/pages/projectlist.js')]
  },
  action() {
    document.title = 'titra - overview'
    this.render('appLayout', 'projectlist')
  },
  name: 'projectlist',
})
FlowRouter.route('/edit/project/:id', {
  waitOn() {
    return import('../../ui/pages/editproject.js')
  },
  action() {
    document.title = 'titra - edit project'
    this.render('appLayout', 'editproject')
  },
  name: 'editproject',
})
FlowRouter.route('/create/project/', {
  waitOn() {
    return import('../../ui/pages/editproject.js')
  },
  action() {
    document.title = 'titra - create project'
    this.render('appLayout', 'editproject')
  },
  name: 'createProject',
})
FlowRouter.route('/list/timecards/:projectId', {
  waitOn() {
    return [import('../../ui/components/tablecell.js'), import('../../ui/pages/timecardlist.js')]
  },
  action() {
    document.title = 'titra - details'
    this.render('appLayout', 'timecardlist')
  },
  name: 'timecards',
})
FlowRouter.route('/settings', {
  waitOn() {
    return import('../../ui/pages/settings.js')
  },
  action() {
    document.title = 'titra - settings'
    this.render('appLayout', 'settings')
  },
  name: 'settings',
})
FlowRouter.route('/dashboard/:_id', {
  waitOn() {
    return import('../../ui/pages/dashboard.js')
  },
  action() {
    document.title = 'titra - dashboard'
    this.render('appLayout', 'dashboard')
  },
  name: 'dashboard',
})
FlowRouter.route('/join', {
  action() {
    this.render('appLayout', 'register')
  },
  name: 'register',
})
FlowRouter.route('/signIn', {
  action() {
    this.render('appLayout', 'signIn')
  },
  name: 'signIn',
})
FlowRouter.route('/changePwd/:token?', {
  action() {
    this.render('appLayout', 'changePassword')
  },
  name: 'changePassword',
})
FlowRouter.route('/try', {
  action() {
    if (Meteor.userId()) {
      FlowRouter.go('/')
    } else {
      AccountsAnonymous.login((error) => {
        if (!error) {
          FlowRouter.go('/')
        } else {
          console.error(error)
        }
      })
    }
  },
  name: 'try',
})
FlowRouter.route('/404', {
  action() {
    this.render('appLayout', '404')
  },
  name: '404',
})
