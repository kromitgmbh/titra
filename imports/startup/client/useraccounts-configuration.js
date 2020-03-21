import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

Accounts.onResetPasswordLink((token, done) => {
  FlowRouter.go('changePassword', { token })
  done()
})
Accounts.onLogout(() => {
  window.location.href = '/'
})
