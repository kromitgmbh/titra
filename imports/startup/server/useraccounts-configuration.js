import { Accounts } from 'meteor/accounts-base'
import dockerNames from 'docker-names'
import { getGlobalSetting } from '../../utils/frontend_helpers'
import initNewUser from '../../api/projects/setup.js'

Accounts.setAdditionalFindUserOnExternalLogin((user) => {
  if (user.serviceName === 'oidc' && user?.options?.emails?.[0]) {
    return Meteor.users.findOne({ 'emails.0.address': user.options.emails[0].address })
  }
  return undefined
})

Accounts.onCreateUser((options, user) => {
  if (options.anonymous) {
    options.profile = {
      name: dockerNames.getRandomName(),
      avatarColor: `#${(`000000${Math.floor(0x1000000 * Math.random()).toString(16)}`).slice(-6)}`,
    }
  }
  if (!options.profile.currentLanguageProject) {
    options.profile.currentLanguageProject = 'Projekt'
    options.profile.currentLanguageProjectDesc = 'Dieses Projekt wurde automatisch erstellt, Sie können es nach Belieben bearbeiten. Wussten Sie, dass Sie Emojis wie 💰 ⏱ 👍 überall verwenden können?'
  }

  initNewUser(user._id, options)

  const localUser = user
  if (options.profile) {
    localUser.profile = options.profile
    delete localUser.profile.currentLanguageProject
    delete localUser.profile.currentLanguageProjectDesc
  }

  if (!localUser.emails && options.emails) {
    localUser.emails = options.emails
  }

  // the first user registered on a server will automatically receive the isAdmin flag
  if (Meteor.users.find().count === 0) {
    localUser.isAdmin = true
  }
  return localUser
})

Accounts.emailTemplates.from = `${getGlobalSetting('fromName')} <${getGlobalSetting('fromAddress')}>`
Accounts.emailTemplates.enrollAccount.subject = (user) => `Welcome to Awesome Town, ${user.profile.name}`
Accounts.emailTemplates.resetPassword.from = () => `${getGlobalSetting('fromName')} Password Reset <${getGlobalSetting('fromAddress')}>`
