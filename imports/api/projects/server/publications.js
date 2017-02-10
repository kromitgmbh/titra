import { check } from 'meteor/check'
import Projects from '../projects'

Meteor.publish('myprojects', function myProjects() {
  if (!this.userId) {
    return this.ready()
  }
  return Projects.find({ $or: [{ userId: this.userId }, { public: true }] })
})
Meteor.publish('singleProject', function singleProject(projectId) {
  check(projectId, String)
  if (!this.userId) {
    return this.ready()
  }
  return Projects.find({ $or: [{ userId: this.userId }, { public: true }], _id: projectId })
})
