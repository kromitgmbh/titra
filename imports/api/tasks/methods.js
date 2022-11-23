import { ValidatedMethod } from 'meteor/mdg:validated-method'
import Tasks from './tasks.js'
import { checkAuthentication } from '../../utils/server_method_helpers.js'

const insertProjectTask = new ValidatedMethod({
  name: 'insertProjectTask',
  validate(args) {
    check(args, {
      projectId: String,
      name: String,
      start: Date,
      end: Date,
      dependencies: Match.Optional([String]),
    })
  },
  run({
    projectId, name, start, end, dependencies,
  }) {
    checkAuthentication(this)
    Tasks.insert({
      projectId,
      name,
      start,
      end,
      dependencies,
    })
  },
})
const updateTask = new ValidatedMethod({
  name: 'updateTask',
  validate(args) {
    check(args, {
      taskId: String,
      projectId: Match.Optional(String),
      name: Match.Optional(String),
      start: Match.Optional(Date),
      end: Match.Optional(Date),
      dependencies: Match.Optional([String]),
    })
  },
  run({
    taskId, name, start, end, dependencies,
  }) {
    checkAuthentication(this)
    const updatedTask = {
    }
    if (name) updatedTask.name = name
    if (start) updatedTask.start = start
    if (end) updatedTask.end = end
    if (dependencies) updatedTask.dependencies = dependencies
    if (updatedTask) {
      Tasks.update(taskId, {
        $set: {
          name,
          start,
          end,
          dependencies,
        },
      })
    }
  },
})
const removeProjectTask = new ValidatedMethod({
  name: 'removeProjectTask',
  validate(args) {
    check(args, {
      taskId: String,
    })
  },
  run({ taskId }) {
    checkAuthentication(this)
    Tasks.remove({ _id: taskId })
  },
})

export {
  insertProjectTask, updateTask, removeProjectTask,
}
