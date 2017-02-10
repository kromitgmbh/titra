// import { AccountsTemplates } from 'meteor/useraccounts:core'
import { Accounts } from 'meteor/accounts-base'
import initNewUser from '../../api/projects/setup.js'

// AccountsTemplates.configure({
//   postSignUpHook: initNewUser,
// })

Accounts.onCreateUser((options, user) => {
  initNewUser(user._id, options)
  const localUser = user
  if (options.profile) {
    localUser.profile = options.profile
  }
  return localUser
})
