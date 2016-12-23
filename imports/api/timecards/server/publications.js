import { Timecards } from '../timecards.js'

Meteor.publish('projectTimecards', function(id) {
  if(!this.userId || !Timecards.findOne({ projectId: id, userId: this.userId })) {
    return this.ready()
  }
  return Timecards.find({ projectId: id, userId: this.userId })
})
