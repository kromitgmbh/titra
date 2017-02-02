import './projectlist.html'
import Projects from '../../api/projects/projects'
import '../components/timetracker.js'

Template.projectlist.onCreated(function createTrackTime() {
  this.subscribe('myprojects')
  // this.projects = new ReactiveVar()
  // Meteor.call('getProjectStats', (error, result) => {
  //   if (!error) {
  //     this.projects.set(result)
  //   } else {
  //     console.error(error)
  //   }
  // })
})
Template.projectlist.helpers({
  projects() {
    return Projects.find()
    // return Template.instance().projects.get()
  },
})

Template.projectlist.events({
  'click .js-delete-project'(event) {
    event.preventDefault()
    Meteor.call('deleteProject', { projectId: event.currentTarget.parentNode.parentNode.id }, (error, result) => {
      if (!error) {
        console.log(result)
      } else {
        console.error(error)
      }
    })
  },
})
