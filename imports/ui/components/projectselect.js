import { FlowRouter } from 'meteor/kadira:flow-router'
import Projects from '../../api/projects/projects.js'
import Timecards from '../../api/timecards/timecards.js'
import './projectselect.html'

Template.projectselect.onCreated(function createTrackTime() {
  this.subscribe('myprojects')
  this.selectedId = new ReactiveVar()
  if (FlowRouter.getParam('tcid')) {
    this.subscribe('singleTimecard', FlowRouter.getParam('tcid'))
  }
  this.autorun(() => {
    if (this.subscriptionsReady()) {
      if (FlowRouter.getParam('projectId')) {
        this.$('#targetProject').val(FlowRouter.getParam('projectId'))
        this.selectedId.set(FlowRouter.getParam('projectId'))
      }
      if (FlowRouter.getParam('tcid')) {
        this.$('#targetProject').val(Timecards.findOne().projectId)
        this.selectedId.set(Timecards.findOne().projectId)
      }
    }
  })
})
Template.projectselect.helpers({
  projects() {
    return Projects.find()
  },
})

Template.projectselect.events({
  'change #targetProject': (event, templateInstance) => {
    templateInstance.selectedId.set($(event.currentTarget).val())
  },
})
