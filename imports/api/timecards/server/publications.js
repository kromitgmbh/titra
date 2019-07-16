import Timecards from '../timecards.js'
import Projects from '../../projects/projects.js'
import periodToDates from '../../../utils/periodHelpers.js'

Meteor.publish('projectTimecards', function projectTimecards({ projectId, period, userId }) {
  check(projectId, String)
  check(period, String)
  check(userId, String)
  // console.log(projectId)
  let projectList = []
  if (projectId === 'all') {
    projectList = Projects.find(
      {
        $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
      },
      { $fields: { _id: 1 } },
    ).fetch().map(value => value._id)
  } else {
    projectList = [Projects.findOne({ _id: projectId })._id]
  }
  // const project = Projects.findOne({ _id: { $in: projectList } })
  // if (!this.userId || (!Timecards.findOne({ projectId, userId: this.userId })) {
  //   return this.ready()
  // }
  if (period && period !== 'all') {
    const { startDate, endDate } = periodToDates(period)
    if (userId === 'all') {
      return Timecards.find({
        projectId: { $in: projectList },
        date: { $gte: startDate, $lte: endDate },
      })
    }
    return Timecards.find({
      projectId: { $in: projectList },
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
  }
  if (userId === 'all') {
    return Timecards.find({ projectId: { $in: projectList } })
  }
  return Timecards.find({ projectId: { $in: projectList }, userId })
})

Meteor.publish('periodTimecards', function periodTimecards({ startDate, endDate, userId }) {
  check(startDate, Date)
  check(endDate, Date)
  check(userId, String)
  const projectList = Projects.find(
    { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
    { $fields: { _id: 1 } },
  ).fetch().map(value => value._id)

  if (userId === 'all') {
    return Timecards.find({
      projectId: { $in: projectList },
      date: { $gte: startDate, $lte: endDate },
    })
  }
  return Timecards.find({
    projectId: { $in: projectList },
    userId,
    date: { $gte: startDate, $lte: endDate },
  })
})

Meteor.publish('myTimecardsForDate', function myTimecardsForDate({ date }) {
  check(date, String)
  return Timecards.find({
    userId: this.userId,
    date: new Date(date),
  })
})

Meteor.publish('singleTimecard', function singleTimecard(_id) {
  check(_id, String)
  const timecard = Timecards.findOne({ _id })
  const project = Projects.findOne({ _id: timecard.projectId })
  if (!this.userId || (!Timecards.findOne({ userId: this.userId }) && !project.public)) {
    return this.ready()
  }
  return Timecards.find({ _id })
})

// Meteor.publish('dailyTimecards', function dailyTimecards({ projectId, userId, period }) {
//   check(projectId, String)
//   check(period, String)
//   check(userId, String)
//   let timecards = []
//   let initializing = true
//
//   // console.log(projectId)
//   let projectList = []
//   if (projectId === 'all') {
//     projectList = Projects.find(
//       {
//         $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
//       },
//       { $fields: { _id: 1 } },
//     ).fetch().map(value => value._id)
//   } else {
//     projectList = [Projects.findOne({ _id: projectId })._id]
//   }
//   if (period && period !== 'all') {
//     const { startDate, endDate } = periodToDates(period)
//     if (userId === 'all') {
//       timecards = Promise.await(Timecards.rawCollection().aggregate([
//         {
//           $match: {
//             projectId: { $in: projectList },
//             date: { $gte: startDate, $lte: endDate },
//           },
//         },
//         {
//           $group: {
//             _id: { userId: '$userId', projectId: '$projectId' },
//             totalHours: { $sum: '$hours' },
//           },
//         },
//       ]).toArray())
//     }
//     timecards = Promise.await(Timecards.rawCollection().aggregate([
//       {
//         $match: {
//           projectId: { $in: projectList },
//           date: { $gte: startDate, $lte: endDate },
//           userId,
//         },
//       },
//       {
//         $group: {
//           _id: { userId: '$userId', projectId: '$projectId' },
//           totalHours: { $sum: '$hours' },
//         },
//       },
//     ]).toArray())
//   }
//   if (userId === 'all') {
//     timecards = Promise.await(Timecards.rawCollection().aggregate([
//       {
//         $match: {
//           projectId: { $in: projectList },
//         },
//       },
//       {
//         $group: {
//           _id: { resource: '$resource', projectId: '$projectId' },
//           totalHours: { $sum: '$hours' },
//         },
//       },
//     ]).toArray())
//   }
//   timecards = Promise.await(Timecards.rawCollection().aggregate([
//     {
//       $match: {
//         projectId: { $in: projectList },
//         userId,
//       },
//     },
//     {
//       $group: {
//         _id: { userId: '$userId', projectId: '$projectId' },
//         totalHours: { $sum: '$hours' },
//       },
//     },
//   ]).toArray())
//
//
//   // `observeChanges` only returns after the initial `added` callbacks have run.
//   // Until then, we don't want to send a lot of `changed` messages—hence
//   // tracking the `initializing` state.
//   const handle = Timecards.find({ projectId: { $in: projectList } }).observeChanges({
//     added: (id) => {
//       if (!initializing) {
//         this.changed('dailytimecards', timecards)
//       }
//     },
//     removed: (id) => {
//       this.changed('dailytimecards', timecards)
//     },
//   })
//
//   // Instead, we'll send one `added` message right after `observeChanges` has
//   // returned, and mark the subscription as ready.
//   initializing = false
//   this.added('dailytimecards', timecards)
//   this.ready()
//
//   // Stop observing the cursor when the client unsubscribes. Stopping a
//   // subscription automatically takes care of sending the client any `removed`
//   // messages.
//   this.onStop(() => handle.stop())
// })
