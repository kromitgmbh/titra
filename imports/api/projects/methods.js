import moment from 'moment'
import emoji from 'node-emoji'
import Timecards from '../timecards/timecards'
import Projects from './projects.js'
import { checkAuthentication } from '../../utils/server_method_helpers.js'
import { addNotification } from '../notifications/notifications.js'

const replacer = match => emoji.emojify(match)

Meteor.methods({
  getAllProjectStats() {
    checkAuthentication(this)
    const projectList = Projects.find(
      { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
      { _id: 1 },
    ).fetch().map(value => value._id)
    let totalHours = 0
    let currentMonthHours = 0
    let previousMonthHours = 0
    let beforePreviousMonthHours = 0
    const currentMonthName = moment().format('MMM')
    const currentMonthStart = moment().startOf('month')
    const currentMonthEnd = moment().endOf('month')
    const previousMonthName = moment().subtract('1', 'months').format('MMM')
    const beforePreviousMonthName = moment().subtract('2', 'months').format('MMM')
    const previousMonthStart = moment().subtract('1', 'months').startOf('month')
    const previousMonthEnd = moment().subtract('1', 'months').endOf('month')
    const beforePreviousMonthStart = moment().subtract('2', 'months').startOf('month')
    const beforePreviousMonthEnd = moment().subtract('2', 'months').endOf('month')

    for (const timecard of
      Timecards.find({ projectId: { $in: projectList } }).fetch()) {
      if (moment(new Date(timecard.date)).isBetween(currentMonthStart, currentMonthEnd)) {
        currentMonthHours += Number.parseFloat(timecard.hours)
      } else if (moment(new Date(timecard.date))
        .isBetween(previousMonthStart, previousMonthEnd)) {
        previousMonthHours += Number.parseFloat(timecard.hours)
      } else if (moment(new Date(timecard.date))
        .isBetween(beforePreviousMonthStart, beforePreviousMonthEnd)) {
        beforePreviousMonthHours += Number.parseFloat(timecard.hours)
      }
      totalHours += Number.parseFloat(timecard.hours)
    }
    return {
      totalHours,
      currentMonthName,
      currentMonthHours,
      previousMonthName,
      previousMonthHours,
      beforePreviousMonthName,
      beforePreviousMonthHours,
    }
  },
  updateProject({ projectId, projectArray }) {
    check(projectId, String)
    check(projectArray, Array)
    checkAuthentication(this)
    const updateJSON = {}
    for (const projectAttribute of projectArray) {
      updateJSON[projectAttribute.name] = projectAttribute.value
    }
    updateJSON.name = updateJSON.name.replace(/(:.*:)/g, replacer)
    if (!updateJSON.public) {
      updateJSON.public = false
    } else {
      updateJSON.public = true
    }
    Projects.update({ userId: this.userId, _id: projectId }, { $set: updateJSON })
  },
  createProject({ projectArray }) {
    check(projectArray, Array)
    checkAuthentication(this)
    const updateJSON = {}
    for (const projectAttribute of projectArray) {
      updateJSON[projectAttribute.name] = projectAttribute.value
    }
    if (!updateJSON.public) {
      updateJSON.public = false
    } else {
      updateJSON.public = true
    }
    updateJSON.name = updateJSON.name.replace(/(:.*:)/g, replacer)
    updateJSON._id = Random.id()
    updateJSON.userId = this.userId
    Projects.insert(updateJSON)
    return updateJSON._id
  },
  deleteProject({ projectId }) {
    check(projectId, String)
    checkAuthentication(this)
    Projects.remove({
      $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
      _id: projectId,
    })
    return true
  },
  archiveProject({ projectId }) {
    check(projectId, String)
    checkAuthentication(this)
    Projects.update({ _id: projectId }, { $set: { archived: true } })
    return true
  },
  restoreProject({ projectId }) {
    check(projectId, String)
    checkAuthentication(this)
    Projects.update({ _id: projectId }, { $set: { archived: false } })
    return true
  },
  getTopTasks({ projectId }) {
    check(projectId, String)
    checkAuthentication(this)
    const projectList = Projects.find(
      { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
      { _id: 1 },
    ).fetch().map(value => value._id)
    const rawCollection = Timecards.rawCollection()
    // const aggregate = Meteor.wrapAsync(rawCollection.aggregate, rawCollection)
    if (projectId === 'all') {
      return rawCollection.aggregate([{ $match: { projectId: { $in: projectList } } }, { $group: { _id: '$task', count: { $sum: '$hours' } } }, { $sort: { count: -1 } }, { $limit: 3 }]).toArray()
    }
    return rawCollection.aggregate([{ $match: { projectId } }, { $group: { _id: '$task', count: { $sum: '$hours' } } }, { $sort: { count: -1 } }, { $limit: 3 }]).toArray()
  },
  addTeamMember({ projectId, eMail }) {
    check(projectId, String)
    check(eMail, String)
    checkAuthentication(this)
    if (!this.userId) {
      throw new Meteor.Error('You have to be signed in to use this method.')
    }
    const targetProject = Projects.findOne({ _id: projectId })
    if (!targetProject || targetProject.userId !== this.userId) {
      throw new Meteor.Error('Only the project owner can add new team members')
    }
    const targetUser = Meteor.users.findOne({ 'emails.0.address': eMail })
    if (targetUser) {
      Projects.update({ _id: targetProject._id }, { $addToSet: { team: targetUser._id } })
      addNotification(`You have been invited to collaborate on the titra project '${targetProject.name}'`, targetUser._id)
      return 'Team member added successfully.'
    }
    throw new Meteor.Error('No user with this e-mail address could be found, please create the corresponding user account first.')
  },
  removeTeamMember({ projectId, userId }) {
    check(projectId, String)
    check(userId, String)
    checkAuthentication(this)
    const targetProject = Projects.findOne({ _id: projectId })
    if (!targetProject || targetProject.userId !== this.userId) {
      throw new Meteor.Error('Only the project owner can remove team members')
    }
    Projects.update({ _id: targetProject._id }, { $pull: { team: userId } })
    return 'Team member removed successfully'
  },
  updatePriority({ projectId, priority }) {
    check(projectId, String)
    check(priority, Number)
    checkAuthentication(this)
    Projects.update({ _id: projectId }, { $set: { priority } })
    return 'Project priority updated successfully'
  },
})
