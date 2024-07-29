import { Accounts } from 'meteor/accounts-base'
import dockerNames from 'docker-names'
import { getGlobalSettingAsync } from '../../utils/server_method_helpers'
import initNewUser from '../../api/projects/setup.js'

Accounts.setAdditionalFindUserOnExternalLogin(({ serviceName, serviceData }) => {
  if (serviceName === 'oidc') {
    return Accounts.findUserByEmail(serviceData.email)
  }
  return undefined
})
Accounts.validateLoginAttempt((attempt) => !attempt.user?.inactive)
Accounts.onCreateUser(async (options, user) => {
  if (options.anonymous) {
    options.profile = {
      name: dockerNames.getRandomName(),
      avatarColor: `#${(`000000${Math.floor(0x1000000 * Math.random()).toString(16)}`).slice(-6)}`,
    }
  }
  if (!options.profile?.currentLanguageProject) {
    if (options.profile) {
      options.profile.currentLanguageProject = 'Projekt'
      options.profile.currentLanguageProjectDesc = 'Dieses Projekt wurde automatisch erstellt, Sie können es nach Belieben bearbeiten. Wussten Sie, dass Sie Emojis wie 💰 ⏱ 👍 überall verwenden können?'
    }
  }

  await initNewUser(user._id, options)

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
  if (await Meteor.users.find().countAsync() === 0) {
    localUser.isAdmin = true
  }
  return localUser
})
const fromName = await getGlobalSettingAsync('fromName')
const fromAddress = await getGlobalSettingAsync('fromAddress')
Accounts.emailTemplates.from = `${fromName} <${fromAddress}>`
Accounts.emailTemplates.enrollAccount.subject = (user) => `Welcome to Awesome Town, ${user.profile.name}`
Accounts.emailTemplates.resetPassword.from = () => `${fromName} Password Reset <${fromAddress}>`
