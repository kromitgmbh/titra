import { check } from 'meteor/check'
import { checkAuthentication } from '../../../utils/server_method_helpers.js'
import Tasks from '../tasks.js'

Meteor.publish('mytasks', function mytasks({ filter, projectId }) {
  check(filter, Match.Optional(String))
  check(projectId, Match.Optional(String))
  checkAuthentication(this)
  const taskFilter = {
    $or: [{ userId: this.userId }],
  }
  if (projectId) {
    taskFilter.$or.push({ projectId })
  }
  if (filter) {
    taskFilter.name = { $regex: `.*${filter.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' }
  }
  return Tasks.find(taskFilter, { sort: { projectId: -1, lastUsed: -1 }, limit: 10 })
})

Meteor.publish('allmytasks', function mytasks({ filter, limit }) {
  check(filter, Match.Maybe(String))
  check(limit, Number)
  checkAuthentication(this)

  if (filter && filter !== undefined) {
    check(filter, String)
    return Tasks.find({ userId: this.userId, name: { $regex: `.*${filter.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' } }, { limit, sort: { name: 1 } })
  }
  return Tasks.find({ userId: this.userId }, { limit, sort: { name: 1 } })
})

Meteor.publish('projectTasks', function projectTasks({ projectId }) {
  check(projectId, String)
  checkAuthentication(this)
  return Tasks.find({ projectId })
})
