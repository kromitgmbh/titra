import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import i18next from 'i18next'
import './taskSelectPopup.html'
import './datatable.js'
import Tasks from '../../api/tasks/tasks.js'
import Projects from '../../api/projects/projects.js'
import { getGlobalSetting, getUserSetting, i18nextReady, addToolTipToTableCell } from '../../utils/frontend_helpers'

Template.taskSelectPopup.onCreated(function taskSelectPopupCreated() {
  dayjs.extend(utc)
  const templateInstance = this
  templateInstance.activeTab = new ReactiveVar('local-tab')
  templateInstance.taskSelectSearchValue = new ReactiveVar()
  templateInstance.wekanAPITasks = new ReactiveVar()
  templateInstance.modalDisplayed = new ReactiveVar(false)
  templateInstance.limit = new ReactiveVar(10)
  templateInstance.localTasksData = new ReactiveVar([])
  templateInstance.wekanTasksData = new ReactiveVar([])
  templateInstance.zammadTicketsData = new ReactiveVar()
  templateInstance.autorun(() => {
    if (templateInstance.modalDisplayed.get()) {
      templateInstance.subscribe('allmytasks', { limit: this.limit.get(), filter: templateInstance.taskSelectSearchValue.get() })
    }
  })
  templateInstance.autorun(() => {
    if (templateInstance.modalDisplayed.get()) {
      if (i18nextReady.get()) {
        templateInstance.localTasksColumns = new ReactiveVar([{
          name: i18next.t('globals.task'),
          editable: false,
          format: (value) => `<button type="button" class="btn text-primary py-0 js-select-task" data-task="${value}"><i class="fa fa-plus"></i></button><span>${value}</span>`,
        }, {
          name: i18next.t('task.lastUsed'),
          editable: false,
          format: (value) => dayjs(value, 'YYYY/MM/DD').format(getGlobalSetting('dateformat')),
        }])
      }
      const taskFilter = {}
      if (templateInstance.taskSelectSearchValue?.get()) {
        taskFilter.name = { $regex: `.*${templateInstance.taskSelectSearchValue?.get()?.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' }
      }
      templateInstance.localTasksData
        .set(Tasks.find(taskFilter, { limit: templateInstance.limit.get(), sort: { lastUsed: -1 } })
          .fetch().map((element) => [$('<div/>').text(element.name).html(), dayjs(element.lastUsed).format('YYYY/MM/DD')]))
    }
  })
  templateInstance.autorun(() => {
    if (this.modalDisplayed.get() && this.data?.projectId?.get()) {
      const project = Projects.findOne({ _id: this.data?.projectId?.get() })
      if (project) {
        if (project.wekanurl) {
          if (Meteor.settings.public.sandstorm) {
            const ddpcon = DDP.connect(project.wekanurl.replace('#', '/.sandstorm-token/'))
            this.wekanTasks = new Mongo.Collection('cards', { connection: ddpcon })
            ddpcon.subscribe('board', 'sandstorm')
          } else if (project.selectedWekanSwimlanes.length > 0) {
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
          } else if (project.selectedWekanList.length > 0) {
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
        } else {
          this.wekanAPITasks.set(false)
        }
      }
    }
  })
  templateInstance.autorun(() => {
    if (templateInstance.modalDisplayed.get()) {
      if (i18nextReady.get()) {
        templateInstance.wekanTasksColumns = new ReactiveVar([
          {
            name: i18next.t('globals.task'),
            format: (value) => `<button type="button" class="btn text-primary py-0 js-select-task" data-task="${value}"><i class="fa fa-plus"></i></button><span>${value}</span>`,
          },
          {
            name: i18next.t('globals.description'),
            format: addToolTipToTableCell,
          }])
      }
      if (templateInstance.wekanAPITasks.get()) {
        templateInstance.wekanTasksData.set(templateInstance.wekanAPITasks.get()
          .slice(0, templateInstance.limit.get())
          .filter((item) => {
            if (templateInstance.taskSelectSearchValue.get()) {
              return item.title.indexOf(templateInstance.taskSelectSearchValue.get()) >= 0
            }
            return true
          }).sort((a, b) => (a.title > b.title ? 1 : -1))
          .map((element) => [element.title, element.description]))
      }
    }
  })
  templateInstance.autorun(() => {
    if (templateInstance.modalDisplayed.get()) {
      if (i18nextReady.get()) {
        templateInstance.zammadTicketsColumns = new ReactiveVar([
          {
            name: i18next.t('globals.task'),
            format: (value) => `<button type="button" class="btn text-primary py-0 js-select-task" data-task="${value}"><i class="fa fa-plus"></i></button><span>${value}</span>`,
          },
          {
            name: i18next.t('globals.description'),
            format: addToolTipToTableCell,
          }])
        if (!templateInstance.zammadTicketsData.get() && getGlobalSetting('enableZammad') && getUserSetting('zammadurl') && getUserSetting('zammadtoken')) {
          window.fetch(`${getUserSetting('zammadurl')}api/v1/tickets`, { headers: { Authorization: `Token token=${getUserSetting('zammadtoken')}` } }).then((response) => response.json()).then((result) => {
            templateInstance.zammadTicketsData.set(result)
          })
        }
      }
    }
  })
})

Template.taskSelectPopup.helpers({
  localTasks: () => (Template.instance().taskSelectSearchValue?.get()
    ? Tasks.find({ name: { $regex: `.*${Template.instance().taskSelectSearchValue?.get()?.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' } }, { sort: { name: -1 } })
    : Tasks.find({}, { sort: { lastUsed: -1 }, limit: Template.instance().limit.get() })),
  localTasksData: () => Template.instance().localTasksData,
  localTasksColumns: () => Template.instance().localTasksColumns,
  wekanTasksData: () => Template.instance().wekanTasksData,
  wekanTasksColumns: () => Template.instance().wekanTasksColumns,
  wekanTasksDataContent: () => Template.instance().wekanTasksData.get(),
  zammadTicketsColumns: () => Template.instance().zammadTicketsColumns,
  zammadTicketsData: () => new ReactiveVar(Template.instance().zammadTicketsData.get()
    .slice(0, Template.instance().limit.get())
    .filter((item) => {
      if (Template.instance().taskSelectSearchValue.get()) {
        return item.title.indexOf(Template.instance().taskSelectSearchValue.get()) >= 0
      }
      return true
    }).sort((a, b) => (a.title > b.title ? 1 : -1))
    .map((element) => [element.title, element.note])),
  zammadEnabled: () => getGlobalSetting('enableZammad'),
  modalDisplayed: () => Template.instance().modalDisplayed.get(),
  isActive: (tab) => Template.instance().activeTab.get() === tab,
})

Template.taskSelectPopup.events({
  'keyup #taskSelectSearch': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.taskSelectSearchValue.set(templateInstance.$(event.currentTarget).val())
  },
  'click .js-select-task': (event, templateInstance) => {
    event.preventDefault()
    $('.js-tasksearch-results').addClass('d-none')
    $('.js-tasksearch-input').val(templateInstance.$(event.currentTarget).data('task'))
    templateInstance.$('#taskSelectPopup').modal('hide')
  },
  'change #limitSelection': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.limit.set(Number.parseInt(templateInstance.$(event.currentTarget).val(), 10))
  },
  'click .nav-link[data-toggle]': (event, templateInstance) => {
    event.preventDefault()
    window.requestAnimationFrame(() => {
      templateInstance.activeTab.set(templateInstance.$(event.currentTarget).get(0).id)
    })
  },
})

Template.taskSelectPopup.onRendered(() => {
  const templateInstance = Template.instance()
  $('#taskSelectPopup').on('shown.bs.modal', () => {
    $('.js-tasksearch-results').addClass('d-none')
    templateInstance.modalDisplayed.set(true)
  })
  $('#taskSelectPopup').on('hidden.bs.modal', () => {
    templateInstance.modalDisplayed.set(false)
  })
})
