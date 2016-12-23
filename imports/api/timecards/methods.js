import { Timecards } from './timecards.js'

Meteor.methods({
  'insertTimeCard'({ projectId, date, hours }) {
    if(!this.userId){
      throw new Meteor.Error("You have to be signed in to use this method.")
    }
    Timecards.insert({ userId: this.userId, projectId: projectId, date: date, hours: hours })
  }
})
