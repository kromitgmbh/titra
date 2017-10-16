import { AccountsTemplates } from 'meteor/useraccounts:core'

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
  texts: {
    errors: {
      mustBeLoggedIn: 'Please login or sign up to continue.',
      loginForbidden: 'Unable to login, please check your username/password.',
    },
  },
})

AccountsTemplates.addField({
  _id: 'name',
  type: 'text',
  placeholder: {
    signUp: 'Your Fullname',
  },
  required: true,
})

// Accounts.onLogin(() => {
//   FlowRouter.go('/list/projects')
// })

Accounts.onLogout(() => {
  window.location.href = '/'
})
