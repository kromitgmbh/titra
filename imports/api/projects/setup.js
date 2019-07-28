import Projects from './projects.js'

export default function initNewUser(userId, info) {
  if (Meteor.settings.public.sandstorm) {
    if (!Projects.findOne({ public: true })) {
      Projects.insert({
        _id: 'sandstorm',
        userId,
        name: `👋 ${info.profile.name}'s Project`,
        desc: 'This project has been automatically created for you, feel free to change it!',
        public: true,
      })
    }
  } else {
    Projects.insert({
      userId,
      name: `👋 ${info.profile.name}'s Project`,
      desc: 'This project has been automatically created for you, feel free to change it! Did you know that you can use emojis like 💰 ⏱ 👍 everywhere?',
    })
  }
}
