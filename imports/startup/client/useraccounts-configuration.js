import { Accounts } from 'meteor/accounts-base'

Accounts.onResetPasswordLink((token, done) => {
  document.location.href = `/changePwd/${token}`
  done()
})
Accounts.onLogout(() => {
  window.location.href = '/'
})
