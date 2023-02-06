import { Match } from 'meteor/check'
import Timecards from '../../timecards/timecards.js'
import Projects from '../../projects/projects.js'
import { Dashboards } from '../../dashboards/dashboards'
import { checkAuthentication, checkAdminAuthentication } from '../../../utils/server_method_helpers.js'

Meteor.publish('projectUsers', async function projectUsers({ projectId }) {
  check(projectId, String)
  await checkAuthentication(this)
  let userIds = []
  let handle
  let initializing = true
  let uniqueUsers
  if (projectId === 'all') {
    const projectList = Projects.find(
      { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
      { _id: 1 },
    ).fetch().map((value) => value._id)
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
          this.added('projectUsers', projectId, { users: Meteor.users.find({ _id: { $in: uniqueUsers }, inactive: { $ne: true } }, { profile: 1 }).fetch() })
        }
      },
      removed: () => {
        if (!initializing) {
          userIds = []
          Timecards.find({ projectId: { $in: projectList } }).forEach((timecard) => {
            userIds.push(timecard.userId)
          })
          this.changed('projectUsers', projectId, { users: Meteor.users.find({ _id: { $in: uniqueUsers }, inactive: { $ne: true } }, { profile: 1 }).fetch() })
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
          this.added('projectUsers', projectId, { users: Meteor.users.find({ _id: { $in: uniqueUsers }, inactive: { $ne: true } }, { profile: 1 }).fetch() })
        }
      },
      removed: () => {
        if (!initializing) {
          userIds = []
          Timecards.find({ projectId }).forEach((timecard) => {
            userIds.push(timecard.userId)
          })
          uniqueUsers = [...new Set(userIds)]
          this.changed('projectUsers', projectId, { users: Meteor.users.find({ _id: { $in: uniqueUsers }, inactive: { $ne: true } }, { profile: 1 }).fetch() })
        }
      },
    })
  }
  uniqueUsers = [...new Set(userIds)]
  initializing = false
  this.added('projectUsers', projectId, { users: Meteor.users.find({ _id: { $in: uniqueUsers }, inactive: { $ne: true } }, { profile: 1 }).fetch() })
  this.ready()
  this.onStop(() => {
    handle.stop()
  })
})

Meteor.publish('projectTeam', async function projectTeam({ userIds }) {
  check(userIds, Array)
  await checkAuthentication(this)
  return Meteor.users.find(
    { _id: { $in: userIds }, inactive: { $ne: true } },
    {
      fields: { 'profile.name': 1 },
    },
  )
})

Meteor.publish('dashboardUser', async function dashboardUser({ _id }) {
  check(_id, String)
  await checkAuthentication(this)
  const dashboard = await Dashboards.findOneAsync({ _id })
  return Meteor.users.find({ _id: dashboard.resourceId }, { fields: { 'profile.name': 1 } })
})

Meteor.publish('userRoles', async function userRoles() {
  await checkAuthentication(this)
  return Meteor.users.find({ _id: this.userId }, { fields: { profile: 1, isAdmin: 1 } })
})

Meteor.publish('adminUserList', async function adminUserList({ limit }) {
  await checkAdminAuthentication(this)
  check(limit, Match.Maybe(Number))
  const options = {}
  options.fields = {
    profile: 1, emails: 1, isAdmin: 1, createdAt: 1, inactive: 1,
  }
  options.sort = { createdAt: -1 }
  if (limit) {
    options.limit = limit
  }
  return Meteor.users.find({}, options)
})

Meteor.publish('projectResources', async function projectResources({ projectId }) {
  check(projectId, Match.OneOf(String, Array))
  await checkAuthentication(this)
  let userIds = []
  let handle
  let initializing = true
  let uniqueUsers
  if (projectId.includes('all')) {
    let projectList = await Projects.find(
      { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
      { _id: 1 },
    ).fetchAsync()
    projectList = projectList.map((value) => value._id)
    if (await Timecards.find({ projectId: { $in: projectList } }).countAsync() <= 0) {
      return this.ready()
    }
    Timecards.find({ projectId: { $in: projectList } }).forEach((timecard) => {
      userIds.push(timecard.userId)
    })
    handle = Timecards.find({ projectId: { $in: projectList } }).observeChanges({
      added: async (_id) => {
        if (!initializing) {
          const newUserId = await Timecards.findOneAsync(_id).userId
          if (!userIds.includes(newUserId)) {
            userIds.push(newUserId)
            let meteorUser = await Meteor.users
              .findOneAsync({ _id: newUserId, inactive: { $ne: true } }, { profile: 1 })
            meteorUser = meteorUser?.profile
            if (meteorUser) {
              this.added('projectResources', newUserId, meteorUser)
            }
          }
        }
      },
      removed: async () => {
        if (!initializing) {
          userIds = []
          Timecards.find({ projectId: { $in: projectList } }).forEach((timecard) => {
            userIds.push(timecard.userId)
          })
          uniqueUsers = [...new Set(userIds)]
          for (const userId of uniqueUsers) {
            // eslint-disable-next-line no-await-in-loop
            let meteorUser = await Meteor.users
              .findOneAsync({ _id: userId, inactive: { $ne: true } }, { profile: 1 })
            meteorUser = meteorUser?.profile
            if (meteorUser) {
              this.changed('projectResources', userId, meteorUser)
            }
          }
        }
      },
      // don't care about changed
    })
  } else {
    let selector = { projectId }
    if (projectId instanceof Array) { selector = { projectId: { $in: projectId } } }
    Timecards.find(selector).forEach((timecard) => {
      userIds.push(timecard.userId)
    })
    handle = Timecards.find(selector).observeChanges({
      added: async (_id) => {
        let newUserId = await Timecards.findOneAsync(_id)
        newUserId = newUserId?.userId
        if (!userIds.includes(newUserId)) {
          let meteorUser = await Meteor.users
            .findOneAsync({ _id: newUserId, inactive: { $ne: true } }, { profile: 1 })
          meteorUser = meteorUser?.profile
          if (meteorUser) {
            userIds.push(newUserId)
            this.added('projectResources', newUserId)
          }
        }
      },
      removed: () => {
        if (!initializing) {
          userIds = []
          Timecards.find(selector).forEach((timecard) => {
            userIds.push(timecard.userId)
          })
          uniqueUsers = [...new Set(userIds)]
          uniqueUsers.forEach(async (userId) => {
            let meteorUser = await Meteor.users
              .findOneAsync({ _id: userId, inactive: { $ne: true } }, { profile: 1 })
            meteorUser = meteorUser?.profile
            if (meteorUser) {
              this.changed('projectResources', userId, meteorUser)
            }
          })
        }
      },
    })
  }
  uniqueUsers = [...new Set(userIds)]
  initializing = false
  for (const userId of uniqueUsers) {
    // eslint-disable-next-line no-await-in-loop
    let meteorUser = await Meteor.users
      .findOneAsync({ _id: userId, inactive: { $ne: true } }, { profile: 1 })
    meteorUser = meteorUser?.profile
    if (meteorUser) {
      this.added('projectResources', userId, meteorUser)
    }
  }
  this.ready()
  this.onStop(() => {
    handle.stop()
  })
})
