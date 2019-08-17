import { Accounts } from 'meteor/accounts-base'
import initNewUser from '../../api/projects/setup.js'

Accounts.onCreateUser((options, user) => {
  initNewUser(user._id, options)
  const localUser = user
  if (options.profile) {
    localUser.profile = options.profile
    delete localUser.profile.currentLanguageProject
    delete localUser.profile.currentLanguageProjectDesc
  }
  return localUser
})
