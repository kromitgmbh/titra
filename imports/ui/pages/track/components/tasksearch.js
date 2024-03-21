import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { DDP } from 'meteor/ddp-client'
import { Mongo } from 'meteor/mongo'
import './tasksearch.html'
import './taskSelectPopup.js'
import { t } from '../../../../utils/i18n.js'
import Tasks from '../../../../api/tasks/tasks.js'
import Timecards from '../../../../api/timecards/timecards.js'
import Projects from '../../../../api/projects/projects.js'
import { getGlobalSetting, getUserSetting, showToast } from '../../../../utils/frontend_helpers'
import Autocomplete from '../../../../utils/autocomplete'

Template.tasksearch.events({
  'click .js-show-task-select-popup': (event) => {
    event.preventDefault()
    $('#taskSelectPopup').modal('show')
  },
  'keyup .js-tasksearch-input': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.filter.set(templateInstance.$(event.currentTarget).val())
  },
  'click .js-remove-value': (event, templateInstance) => {
    event.preventDefault()
    event.stopPropagation()
    templateInstance.$('.js-tasksearch-input').val('')
    templateInstance.filter.set('')
    templateInstance.targetTask.renderIfNeeded()
  },
  'click .js-show-task-rate': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-task-rate-container').toggleClass('d-none')
  },
})

Template.tasksearch.onCreated(function tasksearchcreated() {
  this.filter = new ReactiveVar()
  this.wekanAPITasks = new ReactiveVar()
  this.zammadAPITasks = new ReactiveVar()
  this.gitlabAPITasks = new ReactiveVar()
  this.project = new ReactiveVar()
  this.inboundInterfaceTasks = new ReactiveVar([])
  Meteor.call('inboundinterfaces.get', (inboundinterfaceserror, inboundInterfaces) => {
    if (inboundinterfaceserror) {
      console.error(inboundinterfaceserror)
    } else {
      for (const inboundInterface of inboundInterfaces) {
        Meteor.call('inboundinterfaces.getTasks', { _id: inboundInterface._id, projectId: FlowRouter.getParam('projectId') }, (error, result) => {
          if (error) {
            console.error(error)
          } else {
            this.inboundInterfaceTasks.set(this.inboundInterfaceTasks.get().concat(result))
          }
        })
      }
    }
  })
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
        this.project.set(project)
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
              window.fetch(`${url}swimlanes/${swimlane}/cards`, { headers: { Authorization: `Bearer ${authToken}` } }).then((response) => response.json()).then((innerResult) => {
                Array.prototype.push.apply(wekanAPITasks, innerResult)
                this.wekanAPITasks.set(wekanAPITasks)
              }).catch((error) => {
                showToast(t('notifications.wekan_error'))
              })
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
              window.fetch(`${url}lists/${wekanList}/cards`, { headers: { Authorization: `Bearer ${authToken}` } }).then((response) => response.json()).then((innerResult) => {
                Array.prototype.push.apply(wekanAPITasks, innerResult)
                this.wekanAPITasks.set(wekanAPITasks)
              }).catch((error) => {
                showToast(t('notifications.wekan_error'))
              })
            }
          }
        }
      }
    }
  })
  this.autorun(() => {
    if (!this.zammadAPITasks.get() && getGlobalSetting('enableZammad') && getUserSetting('zammadurl') && getUserSetting('zammadtoken')) {
      window.fetch(`${getUserSetting('zammadurl')}api/v1/tickets`, { headers: { Authorization: `Token token=${getUserSetting('zammadtoken')}` } }).then((response) => response.json()).then((result) => {
        this.zammadAPITasks.set(result)
      }).catch((error) => {
        showToast(t('notifications.zammad_error'))
      })
    }
  })
  this.autorun(() => {
    if (!this.gitlabAPITasks.get() && getGlobalSetting('enableGitlab') && getUserSetting('gitlaburl') && getUserSetting('gitlabtoken')) {
      const query = this.project.get()?.gitlabquery ? this.project.get()?.gitlabquery : 'issues'
      const headers = new Headers({
        'PRIVATE-TOKEN': getUserSetting('gitlabtoken'),
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
        'Access-Control-Allow-Headers': 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization',

      })
      window.fetch(
        `${getUserSetting('gitlaburl')}api/v4/${query}`,
        {
          headers,
        },
      ).then((response) => response.json()).then((result) => {
        this.gitlabAPITasks.set(result)
      }).catch((error) => {
        showToast(t('notifications.gitlab_error'))
      })
    }
  })
  this.autorun(() => {
    this.subscribe('mytasks', { filter: this.filter.get(), projectId: this.data.projectId.get() ? this.data.projectId.get() : FlowRouter.getParam('projectId') })
  })
  this.autorun(() => {
    if (this.data.projectId.get()) {
      this.taskSelectPopup = Blaze.renderWithData(
        Template.taskSelectPopup,
        { projectId: this.data.projectId },
        document.body,
      )
    }
  })
  this.autorun(() => {
    if (this.subscriptionsReady()) {
      let data = []
      if (!Template.instance().filter.get() || Template.instance().filter.get() === '') {
        data = Tasks.find({}, { sort: { projectId: -1, lastUsed: -1 }, limit: getGlobalSetting('taskSearchNumResults') })
          .fetch().map((task) => ({ label: task.name, value: task._id }))
      } else {
        const finalArray = []
        const wekanAPITasks = Template.instance().wekanAPITasks.get()
        const zammadAPITasks = Template.instance().zammadAPITasks.get()
        const gitlabAPITasks = Template.instance().gitlabAPITasks.get()
        const inboundInterfaceTasks = Template.instance().inboundInterfaceTasks.get()
        const regex = `.*${Template.instance().filter.get().replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`
        if (Template.instance().wekanTasks) {
          const wekanResult = Template.instance().wekanTasks.find({ title: { $regex: regex, $options: 'i' }, archived: false }, { sort: { lastUsed: -1 }, limit: getGlobalSetting('taskSearchNumResults') })
          if (wekanResult.count() > 0) {
            finalArray.push(...wekanResult
              .map((elem) => ({ label: elem.title, value: elem.title, wekan: true })))
          }
        } else if (wekanAPITasks) {
          if (wekanAPITasks.length > 0) {
            finalArray.push(...Template.instance().wekanAPITasks.get().map((elem) => ({ label: elem.title, value: elem.title, wekan: true })).filter((element) => new RegExp(regex, 'i').exec(element.label)))
          }
        }
        if (zammadAPITasks && zammadAPITasks.length > 0) {
          finalArray.push(...zammadAPITasks.map((elem) => ({ label: elem.title, value: elem.title, zammad: true })).filter((element) => new RegExp(regex, 'i').exec(element.label)))
        }
        if (gitlabAPITasks && gitlabAPITasks.length > 0) {
          finalArray.push(...gitlabAPITasks.map((elem) => ({ label: elem.title, value: elem.title, gitlab: true })).filter((element) => new RegExp(regex, 'i').exec(element.label)))
        }
        if (inboundInterfaceTasks && inboundInterfaceTasks.length > 0) {
          finalArray.push(...inboundInterfaceTasks.map((elem) => ({ label: elem.name, value: elem.name, inboundInterface: true })).filter((element) => new RegExp(regex, 'i').exec(element.label)))
        }
        finalArray.push(...Tasks.find({ name: { $regex: regex, $options: 'i' } }, { sort: { projectId: -1, lastUsed: -1 }, limit: getGlobalSetting('taskSearchNumResults') }).fetch().map((task) => ({ label: task.name, value: task._id })))
        data = finalArray
      }
      if (this.targetTask) {
        this.targetTask.setData(data)
      } else {
        this.targetTask = new Autocomplete(this.$('.js-tasksearch-input').get(0), {
          data,
          maximumItems: getGlobalSetting('taskSearchNumResults'),
          threshold: 0,
          onSelectItem: ({ label, value }) => {
            this.$('.js-tasksearch-input').removeClass('is-invalid')
            $('#hours').first().trigger('focus')
          },
        })
      }
    }
  })
})
Template.tasksearch.helpers({
  displayTaskSelectionIcon: () => (Template.instance()?.data?.projectId
    ? Template.instance()?.data?.projectId?.get() : false),
  taskRate: () => Timecards.findOne({ _id: Template.instance().data.tcid?.get() })?.taskRate,
})
Template.tasksearch.onRendered(() => {
  Template.instance().$('#edit-tc-entry-modal').on('hidden.bs.modal', () => {
    Blaze.remove(Template.instance().taskSelectPopup)
  })
})
