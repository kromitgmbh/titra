import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
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
        if (FlowRouter.getParam('projectId') !== 'all') {
          this.$('#targetProject').val(FlowRouter.getParam('projectId'))
          this.selectedId.set(FlowRouter.getParam('projectId'))
        } else if (this.data.allProjects) {
          this.$('#targetProject').val(FlowRouter.getParam('projectId'))
          this.selectedId.set('all')
        }
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
    return Projects.find({ $or: [{ archived: { $exists: false } }, { archived: false }] })
  },
  selectedId() {
    return Template.instance().selectedId.get()
  },
})

Template.projectselect.events({
  'change #targetProject': (event, templateInstance) => {
    templateInstance.$(event.currentTarget).removeClass('is-invalid')
    templateInstance.selectedId.set($(event.currentTarget).val())
    FlowRouter.setParams({ projectId: $(event.currentTarget).val() })
    if ($('.js-tasksearch-input')) {
      $('.js-tasksearch-input').focus()
    }
  },
})
