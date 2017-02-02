import { AccountsTemplates } from 'meteor/useraccounts:core'
import initNewUser from '../../api/projects/setup.js'

AccountsTemplates.configure({
  postSignUpHook: initNewUser,
})
