import Timecards from '../../timecards/timecards.js'
import Projects from '../../projects/projects.js'

Meteor.publish('projectUsers', function projectUsers({ projectId }) {
  check(projectId, String)
  let userIds = []
  let handle
  let initializing = true
  let uniqueUsers
  if (projectId === 'all') {
    const projectList = Projects.find(
      { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
      { _id: 1 },
    ).fetch().map(value => value._id)
    if (Timecards.find({ projectId: { $in: projectList } }).count() <= 0) {
      return this.ready()
    }
    Timecards.find({ projectId: { $in: projectList } }).forEach((timecard) => {
      userIds.push(timecard.userId)
    })
    handle = Timecards.find({ projectId: { $in: projectList } }).observeChanges({
      added: (_id) => {
        if (!initializing) {
          userIds.push(Timecards.findOne(_id).userId)
          uniqueUsers = [...new Set(userIds)]
          this.added('projectUsers', projectId, { users: Meteor.users.find({ _id: { $in: uniqueUsers } }, { profile: 1 }).fetch() })
        }
      },
      removed: (_id) => {
        if (!initializing) {
          userIds.splice(userIds.indexOf(Timecards.findOne(_id).userId), 1)
          uniqueUsers = [...new Set(userIds)]
          this.changed('projectUsers', projectId, { users: Meteor.users.find({ _id: { $in: uniqueUsers } }, { profile: 1 }).fetch() })
        }
      },
      // don't care about changed
    })
  } else {
    Timecards.find({ projectId }).forEach((timecard) => {
      userIds.push(timecard.userId)
    })
    handle = Timecards.find({ projectId }).observeChanges({
      added: (_id) => {
        if (!initializing) {
          userIds.push(Timecards.findOne(_id).userId)
          uniqueUsers = [...new Set(userIds)]
          this.added('projectUsers', projectId, { users: Meteor.users.find({ _id: { $in: uniqueUsers } }, { profile: 1 }).fetch() })
        }
      },
      removed: () => {
        if (!initializing) {
          userIds = []
          Timecards.find({ projectId }).forEach((timecard) => {
            userIds.push(timecard.userId)
          })
          uniqueUsers = [...new Set(userIds)]
          this.changed('projectUsers', projectId, { users: Meteor.users.find({ _id: { $in: uniqueUsers } }, { profile: 1 }).fetch() })
        }
      },
    })
  }
  uniqueUsers = [...new Set(userIds)]
  // observeChanges only returns after the initial `added` callbacks
  // have run. Until then, we don't want to send a lot of
  // `self.changed()` messages - hence tracking the
  // `initializing` state.
  // Instead, we'll send one `self.added()` message right after
  // observeChanges has returned, and mark the subscription as
  // ready.
  initializing = false
  this.added('projectUsers', projectId, { users: Meteor.users.find({ _id: { $in: uniqueUsers } }, { profile: 1 }).fetch() })
  this.ready()
  // Stop observing the cursor when client unsubs.
  // Stopping a subscription automatically takes
  // care of sending the client any removed messages.
  this.onStop(() => {
    handle.stop()
  })
  // return Meteor.users.find({ _id: { $in: uniqueUsers } })
})

Meteor.publish('projectTeam', ({ userIds }) => {
  check(userIds, Array)
  return Meteor.users.find(
    { _id: { $in: userIds } },
    {
      fields: { 'profile.name': 1 },
    },
  )
  // return Projects.findOne({ _id: projectId }).team
  //   ? Meteor.users.find(
  //     { _id: { $in: Projects.findOne({ _id: projectId }).team } },
  //     {
  //       fields: { 'profile.name': 1 },
  //     },
  //   ) : false
})
