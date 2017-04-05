import './resourceselect.html'
import projectUsers from '../../api/users/users.js'

Template.resourceselect.onCreated(function createResourceSelect() {
  // this.resources = new ReactiveVar()
  this.autorun(() => {
    this.subscribe('projectUsers', { projectId: Template.currentData().get() })
  })
})

Template.resourceselect.helpers({
  resources() {
    return projectUsers.findOne({ _id: Template.currentData().get() })
    ? projectUsers.findOne({ _id: Template.currentData().get() }).users : false
  },
})
