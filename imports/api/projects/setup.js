import Projects from './projects.js'

export default async function initNewUser(userId, info) {
  if (info.profile) {
    if (Meteor.settings.public.sandstorm) {
      if (!await Projects.findOneAsync({ public: true })) {
        await Projects.insertAsync({
          _id: 'sandstorm',
          userId,
          name: `👋 ${info.profile?.name}'s ${info.profile?.currentLanguageProject}`,
          desc: { ops: [{ insert: info.profile.currentLanguageProjectDesc }] },
          public: true,
        })
      }
    } else {
      await Projects.insertAsync({
        userId,
        name: `👋 ${info.profile?.name}'s ${info.profile?.currentLanguageProject}`,
        desc: { ops: [{ insert: info.profile.currentLanguageProjectDesc }] },
      })
    }
  }
}
