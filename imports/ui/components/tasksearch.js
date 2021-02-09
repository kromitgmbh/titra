import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { DDP } from 'meteor/ddp-client'
import { Mongo } from 'meteor/mongo'
import './tasksearch.html'
import './taskSelectPopup.js'
import Tasks from '../../api/tasks/tasks.js'
import Timecards from '../../api/timecards/timecards.js'
import Projects from '../../api/projects/projects.js'
import { getGlobalSetting, getUserSetting } from '../../utils/frontend_helpers'

Template.tasksearch.events({
  'mousedown .js-tasksearch-result': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-tasksearch-input').val(templateInstance.$(event.currentTarget).children('.js-tasksearch-task-name').text())
    templateInstance.$('.js-tasksearch-results').addClass('d-none')
    templateInstance.$('.js-tasksearch-input').removeClass('is-invalid')
    if ($('#hours')) {
      $('#hours').focus()
    }
  },
  'focus .js-tasksearch-input': (event, templateInstance) => {
    templateInstance.$('.js-tasksearch-results').removeClass('d-none')
    templateInstance.$('.js-tasksearch-input').removeClass('is-invalid')
  },
  'blur .js-tasksearch-input': (event, templateInstance) => {
    if (!event.relatedTarget) {
      templateInstance.$('.js-tasksearch-results').addClass('d-none')
    }
  },
  'keydown .js-tasksearch-input': (event, templateInstance) => {
    if (event.keyCode === 13) {
      event.preventDefault()
      event.stopPropagation()
      if ($('#hours') && templateInstance.$('.js-tasksearch-input').val()) {
        templateInstance.$('.js-tasksearch-results').addClass('d-none')
        $('#hours').focus()
      }
    }
  },
  'keyup .js-tasksearch-input': (event, templateInstance) => {
    if (event.keyCode === 40) {
      event.preventDefault()
      templateInstance.$('.js-tasksearch-results').removeClass('d-none')
      templateInstance.$(templateInstance.$('.js-tasksearch-result')[0]).focus()
    } else if (event.keyCode === 27) {
      templateInstance.$('.js-tasksearch-results').addClass('d-none')
    } else {
      templateInstance.filter.set(templateInstance.$(event.currentTarget).val())
      templateInstance.$('.js-tasksearch-results').removeClass('d-none')
    }
    // templateInstance.$('.js-tasksearch-results').show()
  },
  'keyup .js-tasksearch-result': (event, templateInstance) => {
    event.preventDefault()
    event.stopPropagation()
    // enter key
    if (event.keyCode === 13) {
      templateInstance.$('.js-tasksearch-input').val(templateInstance.$(event.currentTarget).children('.js-tasksearch-task-name').text())
      templateInstance.$('.js-tasksearch-results').addClass('d-none')
      if ($('#hours')) {
        $('#hours').focus()
      }
    } else if ((event.keyCode === 40 || event.keyCode === 9) // tab or down key
      && event.currentTarget.nextElementSibling) {
      templateInstance.$(event.currentTarget.nextElementSibling).focus()
    } else if (event.keyCode === 38 && event.currentTarget.previousElementSibling) { // up key
      templateInstance.$(event.currentTarget.previousElementSibling).focus()
    } else if (event.keyCode === 27) { // escape key
      templateInstance.$('.js-tasksearch-results').addClass('d-none')
      templateInstance.$('.js-tasksearch-input').focus()
    }
  },
})

Template.tasksearch.onCreated(function tasksearchcreated() {
  this.filter = new ReactiveVar()
  this.wekanAPITasks = new ReactiveVar()
  this.zammadAPITasks = new ReactiveVar()
  // this.lastTimecards = new ReactiveVar()
  this.autorun(() => {
    let tcid
    if (this.data.tcid && this.data.tcid.get()) {
      tcid = this.data.tcid.get()
    } else if (FlowRouter.getParam('tcid')) {
      tcid = FlowRouter.getParam('tcid')
    }
    if (tcid) {
      const handle = this.subscribe('singleTimecard', tcid)
      if (handle.ready()) {
        this.$('.js-tasksearch-input').val(Timecards.findOne({ _id: tcid }).task)
      }
    }
  })
  this.autorun(() => {
    if (FlowRouter.getParam('projectId')) {
      const project = Projects.findOne({ _id: FlowRouter.getParam('projectId') })
      if (project) {
        if (project.wekanurl) {
          if (Meteor.settings.public.sandstorm) {
            const ddpcon = DDP.connect(project.wekanurl.replace('#', '/.sandstorm-token/'))
            this.wekanTasks = new Mongo.Collection('cards', { connection: ddpcon })
            ddpcon.subscribe('board', 'sandstorm')
          } else if (project.selectedWekanSwimlanes?.length > 0) {
            const authToken = project?.wekanurl?.match(/authToken=(.*)/)[1]
            const url = project.wekanurl.substring(0, project.wekanurl.indexOf('export?'))
            const wekanAPITasks = []
            for (const swimlane of project.selectedWekanSwimlanes) {
              try {
                window.fetch(`${url}swimlanes/${swimlane}/cards`, { headers: { Authorization: `Bearer ${authToken}` } }).then((response) => response.json()).then((innerResult) => {
                  Array.prototype.push.apply(wekanAPITasks, innerResult)
                  this.wekanAPITasks.set(wekanAPITasks)
                })
              } catch (error) {
                console.error(error)
              }
            }
          } else if (project.selectedWekanList?.length > 0) {
            let wekanLists = []
            if (typeof project.selectedWekanList === 'string') {
              wekanLists.push(project.selectedWekanList)
            } else if (project.selectedWekanList instanceof Array) {
              wekanLists = project.selectedWekanList
            }
            const authToken = project?.wekanurl?.match(/authToken=(.*)/)[1]
            const url = project.wekanurl.substring(0, project.wekanurl.indexOf('export?'))
            const wekanAPITasks = []
            for (const wekanList of wekanLists) {
              try {
                window.fetch(`${url}lists/${wekanList}/cards`, { headers: { Authorization: `Bearer ${authToken}` } }).then((response) => response.json()).then((innerResult) => {
                  Array.prototype.push.apply(wekanAPITasks, innerResult)
                  this.wekanAPITasks.set(wekanAPITasks)
                })
              } catch (error) {
                console.error(error)
              }
            }
          }
        }
      }
    }
    this.autorun(() => {
      if (!this.zammadAPITasks.get() && getGlobalSetting('enableZammad') && getUserSetting('zammadurl') && getUserSetting('zammadtoken')) {
        window.fetch(`${getUserSetting('zammadurl')}api/v1/tickets`, { headers: { Authorization: `Token token=${getUserSetting('zammadtoken')}` } }).then((response) => response.json()).then((result) => {
          this.zammadAPITasks.set(result)
        })
      }
    })
    this.subscribe('mytasks', this.filter.get() ? this.filter.get() : '')
  })
})
Template.tasksearch.helpers({
  tasks: () => {
    if (!Template.instance().filter.get() || Template.instance().filter.get() === '') {
      return Tasks.find({}, { sort: { lastUsed: -1 }, limit: 3 })
      // return Template.instance().lastTimecards.get()
    }
    const finalArray = []
    const wekanAPITasks = Template.instance().wekanAPITasks.get()
    const zammadAPITasks = Template.instance().zammadAPITasks.get()
    const regex = `.*${Template.instance().filter.get().replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`
    if (Template.instance().wekanTasks) {
      const wekanResult = Template.instance().wekanTasks.find({ title: { $regex: regex, $options: 'i' }, archived: false }, { sort: { lastUsed: -1 }, limit: 5 })
      if (wekanResult.count() > 0) {
        finalArray.push(...wekanResult.map((elem) => ({ name: elem.title, wekan: true })))
      }
    } else if (wekanAPITasks) {
      if (wekanAPITasks.length > 0) {
        finalArray.push(...Template.instance().wekanAPITasks.get().map((elem) => ({ name: elem.title, wekan: true })).filter((element) => new RegExp(regex, 'i').exec(element.name)))
      }
    }
    if (zammadAPITasks && zammadAPITasks.length > 0) {
      finalArray.push(...zammadAPITasks.map((elem) => ({ name: elem.title, zammad: true })).filter((element) => new RegExp(regex, 'i').exec(element.name)))
    }
    finalArray.push(...Tasks.find({ name: { $regex: regex, $options: 'i' } }, { sort: { lastUsed: -1 }, limit: 5 }).fetch())
    return finalArray.length > 0 ? finalArray.slice(0, 4) : false
  },
  task: () => Template.instance().data.task,
  projectId: () => Template.instance()?.data?.projectId,
  displayTaskSelectionIcon: () => (Template.instance()?.data?.projectId
    ? Template.instance()?.data?.projectId?.get() : false)
})
