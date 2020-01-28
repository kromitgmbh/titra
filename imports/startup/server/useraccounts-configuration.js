import { Accounts } from 'meteor/accounts-base'
import { AccountsAnonymous } from 'meteor/brettle:accounts-anonymous'
import dockerNames from 'docker-names'
import initNewUser from '../../api/projects/setup.js'

Accounts.onCreateUser((options, user) => {
  if (options.anonymous) {
    options.profile = {
      name: dockerNames.getRandomName(),
      currentLanguageProject: 'Projekt',
      currentLanguageProjectDesc: 'Dieses Projekt wurde automatisch erstellt, Sie können es nach Belieben bearbeiten. Wussten Sie, dass Sie Emojis wie 💰 ⏱ 👍 überall verwenden können?',
      avatarColor: `#${(`000000${Math.floor(0x1000000 * Math.random()).toString(16)}`).slice(-6)}`,
    }
  }
  initNewUser(user._id, options)
  const localUser = user
  if (options.profile) {
    localUser.profile = options.profile
    delete localUser.profile.currentLanguageProject
    delete localUser.profile.currentLanguageProjectDesc
  }
  // the first user registered on a server will automatically receive the isAdmin flag
  if (Meteor.users.find().count === 0) {
    localUser.isAdmin = true
  }
  return localUser
})
