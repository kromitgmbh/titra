import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import isBetween from 'dayjs/plugin/isBetween'
import { check, Match } from 'meteor/check'
import Timecards from '../timecards/timecards'
import Projects from './projects.js'
import { checkAuthentication } from '../../utils/server_method_helpers.js'
import { addNotification } from '../notifications/notifications.js'
import { emojify, getGlobalSetting } from '../../utils/frontend_helpers'

Meteor.methods({
  getAllProjectStats({ includeNotBillableTime, showArchived }) {
    check(includeNotBillableTime, Match.Maybe(Boolean))
    check(showArchived, Match.Maybe(Boolean))
    const notbillable = includeNotBillableTime
    checkAuthentication(this)
    dayjs.extend(utc)
    dayjs.extend(isBetween)
    const andCondition = [{
      $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
    }]
    if (!showArchived) {
      andCondition.push({ $or: [{ archived: false }, { archived: { $exists: false } }] })
    }
    if (!notbillable) {
      andCondition.push({ $or: [{ notbillable }, { notbillable: { $exists: false } }] })
    }
    const projectList = Projects.find({ $and: andCondition }, { _id: 1 }).fetch().map((value) => value._id)
    let totalHours = 0
    let currentMonthHours = 0
    let previousMonthHours = 0
    let beforePreviousMonthHours = 0
    const currentMonthName = dayjs.utc().format('MMM')
    const currentMonthStart = dayjs.utc().startOf('month')
    const currentMonthEnd = dayjs.utc().endOf('month')
    const previousMonthName = dayjs.utc().subtract('1', 'month').format('MMM')
    const beforePreviousMonthName = dayjs.utc().subtract('2', 'month').format('MMM')
    const previousMonthStart = dayjs.utc().subtract('1', 'month').startOf('month')
    const previousMonthEnd = dayjs.utc().subtract('1', 'month').endOf('month')
    const beforePreviousMonthStart = dayjs.utc().subtract('2', 'month').startOf('month')
    const beforePreviousMonthEnd = dayjs.utc().subtract('2', 'month').endOf('month')

    for (const timecard of
      Timecards.find({ projectId: { $in: projectList } }).fetch()) {
      if (dayjs.utc(new Date(timecard.date)).isBetween(currentMonthStart, currentMonthEnd)) {
        currentMonthHours += Number.parseFloat(timecard.hours)
      } else if (dayjs.utc(new Date(timecard.date))
        .isBetween(previousMonthStart, previousMonthEnd)) {
        previousMonthHours += Number.parseFloat(timecard.hours)
      } else if (dayjs.utc(new Date(timecard.date))
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
    updateJSON.name = updateJSON.name.replace(/(:.*:)/g, emojify)
    if (!updateJSON.public) {
      updateJSON.public = false
    } else {
      updateJSON.public = true
    }
    if (!updateJSON.notbillable) {
      updateJSON.notbillable = false
    } else {
      updateJSON.notbillable = true
    }
    Projects.update({
      $or: [{ userId: this.userId }, { admins: { $in: [this.userId] } }],
      _id: projectId,
    }, { $set: updateJSON })
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
    updateJSON.name = updateJSON.name.replace(/(:.*:)/g, emojify)
    updateJSON._id = Random.id()
    updateJSON.userId = this.userId
    Projects.insert(updateJSON)
    return updateJSON._id
  },
  deleteProject({ projectId }) {
    check(projectId, String)
    checkAuthentication(this)
    Projects.remove({
      $or: [{ userId: this.userId }, { public: true }],
      _id: projectId,
    })
    return true
  },
  archiveProject({ projectId }) {
    check(projectId, String)
    checkAuthentication(this)
    Projects.update({
      _id: projectId,
      $or: [{ userId: this.userId }, { admins: { $in: [this.userId] } }],
    },
    { $set: { archived: true } })
    return true
  },
  restoreProject({ projectId }) {
    check(projectId, String)
    checkAuthentication(this)
    Projects.update({
      _id: projectId,
      $or: [{ userId: this.userId }, { admins: { $in: [this.userId] } }],
    },
    { $set: { archived: false } })
    return true
  },
  getTopTasks({ projectId, includeNotBillableTime, showArchived }) {
    check(projectId, String)
    checkAuthentication(this)
    const rawCollection = Timecards.rawCollection()
    // const aggregate = Meteor.wrapAsync(rawCollection.aggregate, rawCollection)
    if (projectId === 'all') {
      check(showArchived, Match.Maybe(Boolean))
      check(includeNotBillableTime, Match.Maybe(Boolean))
      const notbillable = includeNotBillableTime
      const andCondition = [{
        $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
      }]
      if (!showArchived) {
        andCondition.push({ $or: [{ archived: false }, { archived: { $exists: false } }] })
      }
      if (!notbillable) {
        andCondition.push({ $or: [{ notbillable }, { notbillable: { $exists: false } }] })
      }
      const projectList = Projects.find({ $and: andCondition }, { _id: 1 }).fetch().map((value) => value._id)
      return rawCollection.aggregate([{ $match: { projectId: { $in: projectList } } }, { $group: { _id: '$task', count: { $sum: '$hours' } } }, { $sort: { count: -1 } }, { $limit: 3 }]).toArray()
    }
    return rawCollection.aggregate([{ $match: { projectId } }, { $group: { _id: '$task', count: { $sum: '$hours' } } }, { $sort: { count: -1 } }, { $limit: 3 }]).toArray()
  },
  addTeamMember({ projectId, eMail }) {
    check(projectId, String)
    check(eMail, String)
    checkAuthentication(this)
    const targetProject = Projects.findOne({ _id: projectId })
    if (!targetProject
      || !(targetProject.userId === this.userId
        || targetProject.admins.indexOf(this.userId) >= 0)) {
      throw new Meteor.Error('notifications.only_owner_can_add_team_members')
    }
    const targetUser = Meteor.users.findOne({ 'emails.0.address': eMail })
    if (targetUser) {
      Projects.update({ _id: targetProject._id }, { $addToSet: { team: targetUser._id } })
      addNotification(`You have been invited to collaborate on the titra project '${targetProject.name}'`, targetUser._id)
      return 'notifications.team_member_added_success'
    }
    throw new Meteor.Error('notifications.user_not_found')
  },
  removeTeamMember({ projectId, userId }) {
    check(projectId, String)
    check(userId, String)
    checkAuthentication(this)
    const targetProject = Projects.findOne({ _id: projectId })
    if (!targetProject
      || !(targetProject.userId === this.userId
        || targetProject.admins.indexOf(this.userId) >= 0)) {
      throw new Meteor.Error('notifications.only_owner_can_remove_team_members')
    }
    Projects.update({ _id: targetProject._id }, { $pull: { team: userId } })
    Projects.update({ _id: targetProject._id }, { $pull: { admins: userId } })
    return 'notifications.team_member_removed_success'
  },
  changeProjectRole({ projectId, userId, administrator }) {
    check(projectId, String)
    check(userId, String)
    check(administrator, Boolean)
    checkAuthentication(this)
    const targetProject = Projects.findOne({ _id: projectId })
    if (!targetProject
      || !(targetProject.userId === this.userId
        || targetProject.admins.indexOf(this.userId) >= 0)) {
      throw new Meteor.Error('notifications.only_owner_can_remove_team_members')
    }
    if (administrator) {
      Projects.update({ _id: targetProject._id }, { $push: { admins: userId } })
    } else {
      Projects.update({ _id: targetProject._id }, { $pull: { admins: userId } })
    }
    return 'notifications.access_rights_updated'
  },
  updatePriority({ projectId, priority }) {
    check(projectId, String)
    check(priority, Number)
    checkAuthentication(this)
    Projects.update({ _id: projectId }, { $set: { priority } })
    return 'notifications.project_priority_success'
  },
})
