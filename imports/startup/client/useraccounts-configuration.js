// import i18next from 'i18next'
// import { AccountsTemplates } from 'meteor/useraccounts:core'
//
// AccountsTemplates.configure({
//   defaultLayout: 'appLayout',
//   defaultLayoutRegions: {},
//   defaultContentRegion: 'main',
//   showForgotPasswordLink: true,
//   overrideLoginErrors: true,
//   enablePasswordChange: true,
//   negativeValidation: true,
//   positiveValidation: true,
//   negativeFeedback: false,
//   positiveFeedback: true,
//   texts: {
//     errors: {
//       // mustBeLoggedIn: i18next.t('login.login_or_signup'),
//       // loginForbidden: i18next.t('login.login_failed'),
//     },
//   },
// })
// AccountsTemplates.addField({
//   _id: 'name',
//   type: 'text',
//   placeholder: {
//     // signUp: i18next.t('fullname_placholder'),
//   },
//   required: true,
// })

Accounts.onResetPasswordLink((token, done) => {
  FlowRouter.go('changePassword', { token })
  done()
})
Accounts.onLogout(() => {
  window.location.href = '/'
})
