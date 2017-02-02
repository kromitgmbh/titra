import { FlowRouter } from 'meteor/kadira:flow-router'
import Projects from '../../api/projects/projects.js'
import './projectselect.html'

Template.projectselect.onCreated(function createTrackTime() {
  this.subscribe('myprojects')
  this.autorun(() => {
    if (this.subscriptionsReady()) {
      if (FlowRouter.getParam('projectId')) {
        this.$('#targetProject').val(FlowRouter.getParam('projectId'))
      }
      this.$('select').material_select()
    }
  })
})
Template.projectselect.helpers({
  projects() {
    return Projects.find()
  },
})
