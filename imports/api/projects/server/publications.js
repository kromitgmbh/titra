import { Projects } from '../projects.js'

Meteor.publish('myprojects', function() {
  if(!this.userId) {
    return this.ready()
  }
  return Projects.find({ userId:this.userId })
})
