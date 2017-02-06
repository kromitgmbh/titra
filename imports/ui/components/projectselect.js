import { FlowRouter } from 'meteor/kadira:flow-router'
import Projects from '../../api/projects/projects.js'
import Timecards from '../../api/timecards/timecards.js'
import './projectselect.html'

Template.projectselect.onCreated(function createTrackTime() {
  this.subscribe('myprojects')
  if (FlowRouter.getParam('tcid')) {
    this.subscribe('singleTimecard', FlowRouter.getParam('tcid'))
  }
  this.autorun(() => {
    if (this.subscriptionsReady()) {
      if (FlowRouter.getParam('projectId')) {
        this.$('#targetProject').val(FlowRouter.getParam('projectId'))
      }
      if (FlowRouter.getParam('tcid')) {
        this.$('#targetProject').val(Timecards.findOne().projectId)
      }
      // this.$('select').material_select()
    }
  })
})
Template.projectselect.helpers({
  projects() {
    return Projects.find()
  },
})
