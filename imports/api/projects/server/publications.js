import { check } from 'meteor/check'
import Projects from '../projects'

Meteor.publish('myprojects', function myProjects() {
  if (!this.userId) {
    return this.ready()
  }
  return Projects.find({ userId: this.userId })
})
Meteor.publish('singleProject', function singleProject(projectId) {
  check(projectId, String)
  if (!this.userId) {
    return this.ready()
  }
  return Projects.find({ userId: this.userId, _id: projectId })
})
