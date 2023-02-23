import './projectInfoPopup.html'
import { Meteor } from 'meteor/meteor'
import Projects from '../../../../api/projects/projects.js'
import '../../overview/components/projectProgress.js'

Template.projectInfoPopup.onCreated(function projectInfoPopupCreated() {
  this.project = new ReactiveVar()
  this.projectDescAsHtml = new ReactiveVar()

  this.autorun(() => {
    // this will work only in the project select component context
    // - we should make this more flexible in the future!
    if (Template.parentData(1) && Template.parentData(1).projectId
        && Template.parentData(1).projectId?.get()) {
      this.subscribe('singleProject', Template.parentData(1).projectId.get())
      this.subscribe('projectStats', Template.parentData(1).projectId.get())
    }
    if (this.subscriptionsReady()) {
      if (Template.parentData(1)?.projectId?.get()) {
        const project = Projects.findOne({ _id: Template.parentData(1).projectId.get() })
        this.project.set(project)
        if (project?.desc instanceof Object) {
          import('quill-delta-to-html').then((deltaToHtml) => {
            const converter = new deltaToHtml.QuillDeltaToHtmlConverter(project.desc.ops, {})
            this.projectDescAsHtml.set(converter.convert())
          })
        } else {
          this.projectDescAsHtml.set(project?.desc)
        }
      }
    }
  })
})
Template.projectInfoPopup.helpers({
  name: () => (Template.instance().project.get() ? Template.instance().project.get().name : false),
  projectDescAsHtml: () => Template.instance().projectDescAsHtml.get(),
  desc: () => (Template.instance().project.get() ? Template.instance().project.get().desc : false),
  color: () => (Template.instance().project.get()
    ? Template.instance().project.get().color : Template.instance().color),
  customer: () => (Template.instance().project.get()
    ? Template.instance().project.get().customer : false),
  rate: () => (Template.instance().project.get() ? Template.instance().project.get().rate : false),
  team: () => {
    if (Template.instance().project.get() && Template.instance().project.get().team) {
      return Meteor.users.find({ _id: { $in: Template.instance().project.get().team } })
    }
    return false
  },
  target: () => (Template.instance().project.get()
    ? Template.instance().project.get().target : false),
  notbillable: () => Template.instance().project.get()?.notbillable,
  project: () => Template.instance().project.get(),
})
Template.projectInfoPopup.events({
  'click .js-close-projectinfo-popup': (event, templateInstance) => {
    event.preventDefault()
    $('#projectInfoPopup').modal('hide')
  },
})
