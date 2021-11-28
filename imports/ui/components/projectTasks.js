import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Bootstrap from 'bootstrap'
import { i18nReady, t } from '../../utils/i18n.js'
import './projectTasks.html'
import Tasks from '../../api/tasks/tasks'
import './taskModal.js'
import {
  addToolTipToTableCell, getGlobalSetting, showToast,
} from '../../utils/frontend_helpers'

dayjs.extend(utc)

Template.projectTasks.onCreated(function projectTasksCreated() {
  this.subscribe('projectTasks', { projectId: FlowRouter.getParam('id') })
  this.editTaskID = new ReactiveVar(false)
})

Template.projectTasks.onRendered(() => {
  const templateInstance = Template.instance()
  const tasks = Tasks.find({ projectId: FlowRouter.getParam('id') })
  templateInstance.autorun(() => {
    if (templateInstance.subscriptionsReady() && i18nReady.get() && tasks.count() > 0) {
      const columns = [
        {
          name: t('project.default_task'),
          editable: false,
          width: 1,
          format: (value) => `<div class="form-check"><input type="checkbox" data-id="${value}" class="form-check-input mx-auto" ${Tasks.findOne({ _id: value }).isDefaultTask ? 'checked' : ''}/></div>`,
        },
        {
          name: t('globals.task'),
          editable: true,
          format: addToolTipToTableCell,
          width: 2,
        },
        {
          name: t('task.startDate'),
          editable: true,
          compareValue: (cell, keyword) => [dayjs.utc(cell, getGlobalSetting('dateformat')).toDate(), dayjs(keyword, getGlobalSetting('dateformat')).toDate()],
          format: addToolTipToTableCell,
        },
        {
          name: t('task.endDate'),
          editable: true,
          compareValue: (cell, keyword) => [dayjs.utc(cell, getGlobalSetting('dateformat')).toDate(), dayjs(keyword, getGlobalSetting('dateformat')).toDate()],
          format: addToolTipToTableCell,
        },
        {
          name: t('task.dependencies'),
          editable: true,
          format: addToolTipToTableCell,
          width: 2,
        },
      ]
      const data = tasks.fetch()?.map((task) => [task._id, task.name, dayjs(task.start).format(getGlobalSetting('dateformat')), dayjs(task.end).format(getGlobalSetting('dateformat')),
        task.dependencies?.map((dep) => Tasks.findOne({ _id: dep })?.name).join(','),
      ])
      if (!templateInstance.datatable) {
        import('frappe-datatable/dist/frappe-datatable.css').then(() => {
          import('frappe-datatable').then((datatable) => {
            const DataTable = datatable.default
            const datatableConfig = {
              columns,
              data,
              serialNoColumn: false,
              clusterize: false,
              layout: 'ratio',
              noDataMessage: t('tabular.sZeroRecords'),
              getEditor(colIndex, rowIndex, value, parent, column, row, data) {
                templateInstance.editTaskID.set(row[0].content)
                new Bootstrap.Modal(templateInstance.$('#task-modal')).show()
                return false
              },
            }
            window.requestAnimationFrame(() => {
              templateInstance.datatable = new DataTable('#projectTasks', datatableConfig)
            })
          })
        })
      } else {
        window.requestAnimationFrame(() => {
          templateInstance.datatable.refresh(data, columns)
        })
      }
      const ganttTasks = tasks.fetch()?.map((task) => (
        {
          id: task._id,
          name: task.name,
          start: dayjs(task.start).format('YYYY-MM-DD'),
          end: dayjs(task.end).format('YYYY-MM-DD'),
          dependencies: task.dependencies,
        }))
      const ganttOptions = {
        on_date_change: (task, start, end) => {
          const taskId = task.id
          Meteor.call('updateTask', {
            taskId,
            name: task.name,
            start,
            end,
            dependencies: task.dependencies,
          })
        },
        on_click: (task) => {
          templateInstance.editTaskID.set(task.id)
          new Bootstrap.Modal(templateInstance.$('#task-modal')).show()
        },
      }
      if (!templateInstance.ganttchart) {
        import('frappe-gantt').then((gantt) => {
          const Gantt = gantt.default
          templateInstance.ganttchart = new Gantt('#projectGantt', ganttTasks, ganttOptions)
        })
      } else {
        templateInstance.ganttchart.refresh(ganttTasks)
      }
    }
  })
})
Template.projectTasks.helpers({
  tasks: () => Tasks.find({ projectId: FlowRouter.getParam('id') }),
  editTaskID: () => Template.instance().editTaskID,
})

Template.projectTasks.events({
  'change .form-check-input': (event, templateInstance) => {
    Meteor.call('setDefaultTaskForProject', { projectId: FlowRouter.getParam('id'), taskId: templateInstance.$(event.target).data('id') }, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t('notifications.settings_saved_success'))
      }
    })
  },
  'click .js-open-task-modal': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.editTaskID.set(false)
    Bootstrap.Modal.getOrCreateInstance(templateInstance.$('#task-modal')).dispose()
    Bootstrap.Modal.getOrCreateInstance(templateInstance.$('#task-modal')).show()
  },
})

Template.projectTasks.onDestroyed(() => {
  try {
    Template.instance().datatable?.destroy()
  } catch (error) {
    console.error(error)
  }
  Template.instance().datatable = undefined
})
