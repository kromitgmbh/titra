import { Match } from 'meteor/check'
import Timecards from '../../timecards/timecards.js'
import Projects from '../../projects/projects.js'
import { Dashboards } from '../../dashboards/dashboards'
import { checkAuthentication, checkAdminAuthentication } from '../../../utils/server_method_helpers.js'
/**
 * Publishes the users who tracked time on a project based on the provided project ID.
 * @param {String} projectId - The project ID.
 * @returns {Array} - The list of users that have time tracked for the project ID.
 */
Meteor.publish('projectUsers', async function projectUsers({ projectId }) {
  check(projectId, String)
  await checkAuthentication(this)
  let userIds = []
  let handle
  let initializing = true
  let uniqueUsers
  if (projectId === 'all') {
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
    handle = await Timecards.find({ projectId: { $in: projectList } }).observeChangesAsync({
      added: async (_id) => {
        if (!initializing) {
          userIds.push(await Timecards.findOneAsync(_id).userId)
          uniqueUsers = [...new Set(userIds)]
          this.added('projectUsers', projectId, { users: await Meteor.users.find({ _id: { $in: uniqueUsers }, inactive: { $ne: true } }, { profile: 1 }).fetchAsync() })
        }
      },
      removed: async() => {
        if (!initializing) {
          userIds = []
          Timecards.find({ projectId: { $in: projectList } }).forEach((timecard) => {
            userIds.push(timecard.userId)
          })
          this.changed('projectUsers', projectId, { users: await Meteor.users.find({ _id: { $in: uniqueUsers }, inactive: { $ne: true } }, { profile: 1 }).fetchAsync() })
        }
      },
      // don't care about changed
    })
  } else {
    Timecards.find({ projectId }).forEach((timecard) => {
      userIds.push(timecard.userId)
    })
    handle = await Timecards.find({ projectId }).observeChangesAsync({
      added: async (_id) => {
        if (!initializing) {
          userIds.push(await Timecards.findOneAsync(_id).userId)
          uniqueUsers = [...new Set(userIds)]
          this.added('projectUsers', projectId, { users: await Meteor.users.find({ _id: { $in: uniqueUsers }, inactive: { $ne: true } }, { profile: 1 }).fetchAsync() })
        }
      },
      removed: async () => {
        if (!initializing) {
          userIds = []
          Timecards.find({ projectId }).forEach((timecard) => {
            userIds.push(timecard.userId)
          })
          uniqueUsers = [...new Set(userIds)]
          this.changed('projectUsers', projectId, { users: await Meteor.users.find({ _id: { $in: uniqueUsers }, inactive: { $ne: true } }, { profile: 1 }).fetchAsync() })
        }
      },
    })
  }
  uniqueUsers = [...new Set(userIds)]
  initializing = false
  this.added('projectUsers', projectId, { users: await Meteor.users.find({ _id: { $in: uniqueUsers }, inactive: { $ne: true } }, { profile: 1 }).fetchAsync() })
  this.ready()
  this.onStop(() => {
    handle.stop()
  })
})
/** 
 * Publishes the users who are part of a project team based on the provided user IDs.
 * @param {Array} userIds - The list of user IDs.
 * @returns {Array} - The list of users that are part of the project team.
 */
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
/** 
 * Publishes the user who is the resource of a dashboard based on the provided dashboard ID.
 * @param {String} _id - The dashboard ID.
 * @returns {Object} - The user that is the resource of the dashboard.
 */
Meteor.publish('dashboardUser', async function dashboardUser({ _id }) {
  check(_id, String)
  await checkAuthentication(this)
  const dashboard = await Dashboards.findOneAsync({ _id })
  return Meteor.users.find({ _id: dashboard.resourceId }, { fields: { 'profile.name': 1 } })
})
/**
 * Publishes the user roles based on current user ID.
 * @returns {Object} - The user roles of the current user.
 */
Meteor.publish('userRoles', async function userRoles() {
  await checkAuthentication(this)
  return Meteor.users.find({ _id: this.userId }, { fields: { profile: 1, isAdmin: 1 } })
})
/** 
 * Publishes user list for administrators based on the provided limit and search string.
 * @param {Number} limit - The limit of users to return.
 * @param {String} search - The search string.
 * @returns {Array} - The list of users that match the search string.
 */
Meteor.publish('adminUserList', async function adminUserList({ limit, search }) {
  await checkAdminAuthentication(this)
  check(limit, Match.Maybe(Number))
  check(search, Match.Maybe(String))
  const options = {}
  options.fields = {
    profile: 1, emails: 1, isAdmin: 1, createdAt: 1, inactive: 1,
  }
  let query = {}
  options.sort = { createdAt: -1 }
  if (limit) {
    options.limit = limit
  }
  if (search) {
    query = {
      $or: [
        { 'profile.name': { $regex: `.*${search.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' } },
        { 'emails.address': { $regex: `.*${search.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' } },
      ],
    }
  }
  return Meteor.users.find(query, options)
})

/**
 * Publishes the users who tracked time on a project based on the provided project ID.
 * @param {String} projectId - The project ID.
 * @returns {Array} - The list of users that have time tracked for the project ID.
 */
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
    handle = await Timecards.find({ projectId: { $in: projectList } }).observeChangesAsync({
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
    handle = await Timecards.find(selector).observeChangesAsync({
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
