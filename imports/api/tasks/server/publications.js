import { check } from 'meteor/check'
import Tasks from '../tasks.js'
// import Timecards from '../../timecards/timecards.js'
// import Projects from '../../projects/projects.js'

Meteor.publish('mytasks', function mytasks(filter) {
  check(filter, String)
  if (!this.userId) {
    return this.ready()
  }
  if (filter) {
    check(filter, String)
    // check(filter, String)
    return Tasks.find({ userId: this.userId, name: { $regex: `.*${filter}.*`, $options: 'i' } })
  }
  return Tasks.find({ userId: this.userId })
})
// Meteor.publish('topTasks', function projectStats({ projectId }) {
//   check(projectId, String)
//   if (!this.userId || !Projects.findOne({ _id: projectId,
//     $or: [{ userId: this.userId }, { public: true }] })) {
//     return this.ready()
//   }
//   const rawCollection = Timecards.rawCollection()
//   return rawCollection.aggregate([{ $match: { projectId } }, { $group: { _id: '$task', count: { $sum: 1 } } }])
  // let initializing = true
  // const taskList = new Map()
  // // observeChanges only returns after the initial `added` callbacks
  // // have run. Until then, we don't want to send a lot of
  // // `self.changed()` messages - hence tracking the
  // // `initializing` state.
  // const handle = Timecards.find({ projectId }).observeChanges({
  //   added: (_id) => {
  //     if (!initializing) {
  //       const task = Timecards.findOne({ _id }).task
  //       taskList.set(task, taskList.get(task) + 1)
  //       this.changed('toptasks', projectId, { taskList })
  //     }
  //   },
  //   removed: (_id) => {
  //     if (!initializing) {
  //       const task = Timecards.findOne({ _id }).task
  //       taskList.set(task, taskList.get(task) - 1)
  //       this.changed('toptasks', projectId, { taskList })
  //     }
  //   },
  //   // changed: (timecardId) => {
  //   //   if (!initializing) {
  //   //     const timecard = Timecards.findOne({ _id: timecardId })
  //   //     if (moment(new Date(timecard.date)).isBetween(currentMonthStart, currentMonthEnd)) {
  //   //       currentMonthHours += Number.parseFloat(timecard.hours)
  //   //     }
  //   //     if (moment(new Date(timecard.date)).isBetween(previousMonthStart, previousMonthEnd)) {
  //   //       previousMonthHours += Number.parseFloat(timecard.hours)
  //   //     }
  //   //     if (moment(new Date(timecard.date))
  //   //       .isBetween(beforePreviousMonthStart, beforePreviousMonthEnd)) {
  //   //       beforePreviousMonthHours += Number.parseFloat(timecard.hours)
  //   //     }
  //   //     totalHours += Number.parseFloat(timecard.hours)
  //   //     this.changed('projectStats', projectId, { totalHours, currentMonthName, currentMonthHours, previousMonthHours, previousMonthName, beforePreviousMonthName, beforePreviousMonthHours })
  //   //   }
  //   // },
  // })
  // // Instead, we'll send one `self.added()` message right after
  // // observeChanges has returned, and mark the subscription as
  // // ready.
  // initializing = false
  // for (const timecard of Timecards.find({ projectId }).fetch()) {
  //   taskList.set(timecard.task, { task: timecard.task,
  //     count: taskList.get(timecard.task) ? (taskList.get(timecard.task).count + 1) : 1 })
  //   this.added('toptasks', timecard.task, { count: taskList.get(timecard.task) ? (taskList.get(timecard.task).count + 1) : 1 })
  // }
  // // console.log(Array.from(taskList.values()))
  //
  // // Stop observing the cursor when client unsubs.
  // // Stopping a subscription automatically takes
  // // care of sending the client any removed messages.
  // this.onStop(() => {
  //   handle.stop()
  // })
  // return this.ready()
// })
