import { AccountsTemplates } from 'meteor/useraccounts:core'
import { FlowRouter } from 'meteor/kadira:flow-router'

AccountsTemplates.configure({
  defaultLayout: 'appLayout',
  defaultLayoutRegions: {},
  defaultContentRegion: 'main',

  showForgotPasswordLink: true,
  overrideLoginErrors: true,
  enablePasswordChange: true,
  negativeValidation: true,
  positiveValidation: true,
  negativeFeedback: false,
  positiveFeedback: true,
})

AccountsTemplates.addField({
  _id: 'name',
  type: 'text',
  placeholder: {
    signUp: 'Your Fullname',
  },
  required: true,
})

Accounts.onLogin(() => {
  FlowRouter.go('/list/projects')
})

Accounts.onLogout(() => {
  window.location.href = '/'
})
