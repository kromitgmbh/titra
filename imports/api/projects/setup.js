import Projects from './projects.js'

export default function initNewUser(userId, info) {
  if (Meteor.settings.public.sandstorm) {
    if (!Projects.findOne({ public: true })) {
      Projects.insert({
        _id: 'sandstorm',
        userId,
        name: `👋 ${info.profile.name}'s ${info.profile.currentLanguageProject}`,
        desc: info.profile.currentLanguageProjectDesc,
        public: true,
      })
    }
  } else {
    Projects.insert({
      userId,
      name: `👋 ${info.profile.name}'s ${info.profile.currentLanguageProject}`,
      desc: info.profile.currentLanguageProjectDesc,
    })
  }
}
