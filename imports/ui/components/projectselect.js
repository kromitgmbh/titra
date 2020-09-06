import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import Projects from '../../api/projects/projects.js'
import Timecards from '../../api/timecards/timecards.js'
import './projectInfoPopup.js'
import './projectselect.html'

Template.projectselect.onCreated(function createTrackTime() {
  this.subscribe('myprojects')
  this.selectedId = new ReactiveVar()
  this.tcid = new ReactiveVar()
  this.autorun(() => {
    if (this.data.tcid && this.data.tcid.get()) {
      this.tcid.set(this.data.tcid.get())
    } else if (FlowRouter.getParam('tcid')) {
      this.tcid.set(FlowRouter.getParam('tcid'))
    }
    if (this.tcid.get()) {
      this.subscribe('singleTimecard', this.tcid.get())
    }
  })

  this.autorun(() => {
    if (this.subscriptionsReady()) {
      if (this.data.projectId && this.data.projectId.get() && this.data.projectId.get() !== 'all') {
        this.$('.js-target-project').val(this.data.projectId.get())
        this.selectedId.set(this.data.projectId.get())
      } else if (FlowRouter.getParam('projectId')) {
        if (FlowRouter.getParam('projectId') !== 'all') {
          this.$('.js-target-project').val(FlowRouter.getParam('projectId'))
          this.selectedId.set(FlowRouter.getParam('projectId'))
        } else if (this.data.allProjects) {
          this.$('.js-target-project').val(FlowRouter.getParam('projectId'))
          this.selectedId.set('all')
        }
      } else if (this.tcid.get()) {
        this.$('.js-target-project').val(Timecards.findOne({ _id: this.tcid.get() }).projectId)
        this.selectedId.set(Timecards.findOne({ _id: this.tcid.get() }).projectId)
      }
    }
  })
})
Template.projectselect.helpers({
  projects: () => {
    if (FlowRouter.getQueryParam('customer') && FlowRouter.getQueryParam('customer') !== 'all') {
      return Projects.find({
        customer: FlowRouter.getQueryParam('customer'),
        $or: [{ archived: { $exists: false } }, { archived: false }],
      },
      { sort: { priority: 1, name: 1 } })
    }
    return Projects.find({ $or: [{ archived: { $exists: false } }, { archived: false }] },
      { sort: { priority: 1, name: 1 } })
  },
  selectedId: () => Template.instance().selectedId.get(),
  displayProjectInfo: () => Template.instance().data.displayProjectInfo
    && Template.instance().selectedId.get(),
})

Template.projectselect.events({
  'change .js-target-project': (event, templateInstance) => {
    templateInstance.$(event.currentTarget).removeClass('is-invalid')
    templateInstance.selectedId.set($(event.currentTarget).val())
    if (!(templateInstance.data.tcid && templateInstance.data.tcid.get())
      && !(templateInstance.data.projectId && templateInstance.data.projectId.get())) {
      FlowRouter.setParams({ projectId: $(event.currentTarget).val() })
    }
    if ($('.js-tasksearch-input')) {
      $('.js-tasksearch-input').focus()
    }
  },
})
