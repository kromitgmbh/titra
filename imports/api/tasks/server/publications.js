import { check } from 'meteor/check'
import { checkAuthentication, getGlobalSettingAsync } from '../../../utils/server_method_helpers.js'
import Tasks from '../tasks.js'

Meteor.publish('mytasks', async function mytasks({ filter, projectId }) {
  await checkAuthentication(this)
  const taskFilter = {
    $or: [{ userId: this.userId }],
  }
  if (projectId && projectId !== undefined && projectId !== '') {
    check(projectId, String)
    taskFilter.$or.push({ projectId })
  }
  if (filter && filter !== undefined && filter !== '') {
    check(filter, String)
    taskFilter.name = { $regex: `.*${filter.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' }
  }
  return Tasks.find(taskFilter, { sort: { projectId: -1, lastUsed: -1 }, limit: await getGlobalSettingAsync('taskSearchNumResults') })
})

Meteor.publish('allmytasks', async function mytasks({ filter, limit }) {
  check(filter, Match.Maybe(String))
  check(limit, Number)
  await checkAuthentication(this)

  if (filter && filter !== undefined) {
    check(filter, String)
    return Tasks.find({ userId: this.userId, name: { $regex: `.*${filter.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' } }, { limit, sort: { name: 1 } })
  }
  return Tasks.find({ userId: this.userId }, { limit, sort: { name: 1 } })
})

Meteor.publish('projectTasks', async function projectTasks({ projectId }) {
  check(projectId, String)
  await checkAuthentication(this)
  return Tasks.find({ projectId })
})
