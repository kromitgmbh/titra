import moment from 'moment'
import { Template } from 'meteor/templating'
import emoji from 'node-emoji'
import hex2rgba from '../../utils/hex2rgba.js'
import Timecards from '../../api/timecards/timecards.js'
import Projects from '../../api/projects/projects.js'
import './calendar.html'
import './editTimeEntryModal.js'

Template.calendar.onCreated(function calendarCreated() {
  this.subscribe('myprojects')
  this.startDate = new ReactiveVar(moment.utc().startOf('month').toDate())
  this.endDate = new ReactiveVar(moment.utc().endOf('month').toDate())
  this.tcid = new ReactiveVar()
  this.selectedProjectId = new ReactiveVar()
  this.selectedDate = new ReactiveVar()
})

Template.calendar.onRendered(() => {
  const replacer = (match) => emoji.emojify(match)
  const safeReplacer = (transform) => transform.replace(/(:.*:)/g, replacer).replace(/</g, '&lt;').replace(/>/, '&gt;').replace(/"/g, '&quot;')
  const templateInstance = Template.instance()
  templateInstance.calendarInitialized = new ReactiveVar(false)
  templateInstance.autorun(() => {
    if (window.BootstrapLoaded.get()) {
      import('@fullcalendar/core/main.css')
      import('@fullcalendar/daygrid/main.css')
      import('@fullcalendar/core').then((calendar) => {
        const { Calendar } = calendar
        import('@fullcalendar/daygrid').then((dayGridPlugin) => {
          import('@fullcalendar/interaction').then((interaction) => {
            const interactionPlugin = interaction.default
            const { Draggable } = interaction
            const drags = new Draggable(document.querySelector('.js-project-container'), {
              itemSelector: '.drag',
            })
            const calendarEl = document.getElementById('cal')
            calendarEl.innerHTML = ''
            templateInstance.calendar = new Calendar(calendarEl, {
              plugins: [dayGridPlugin.default, interactionPlugin],
              defaultView: 'dayGridMonth',
              droppable: true,
              aspectRatio: 2,
              height: 'auto',
              timeZone: 'UTC',
              firstDay: 1,
              themeSystem: 'bootstrap',
              events: (fetchInfo, successCallback) => {
                templateInstance.startDate.set(fetchInfo.start)
                templateInstance.endDate.set(fetchInfo.end)
                const events = Timecards.find(
                  {
                    date: {
                      $gte: templateInstance.startDate.get(),
                      $lte: templateInstance.endDate.get(),
                    },
                  },
                ).map((it) => (
                  {
                    id: it._id,
                    title: it.task,
                    start: it.date,
                    allDay: true,
                    backgroundColor: hex2rgba(Projects.findOne({ _id: it.projectId }).color ? Projects.findOne({ _id: it.projectId }).color : '#009688', 100),
                    borderColor: 'rgba(255, 255, 255, 0)',
                    extendedProps: {
                      hours: it.hours,
                    },
                  }))
                successCallback(events)
              },
              eventRender: (info) => {
                if (window.innerWidth >= 768) {
                  $(info.el).tooltip({
                    html: true,
                    placement: 'right',
                    trigger: 'hover',
                    title: `<span>${safeReplacer(info.event.title)}: ${info.event.extendedProps.hours} hours</span>`,
                  })
                }
              },
              drop: function dropEvent(dropInfo) {
                templateInstance.tcid.set(undefined)
                templateInstance.selectedDate.set(dropInfo.date)
                templateInstance.selectedProjectId.set($(dropInfo.draggedEl).data('project'))
                $('#edit-tc-entry-modal').modal({ focus: false })
                // FlowRouter.go(`/tracktime/${$(dropInfo.draggedEl).data('project')}?date=${moment(dropInfo.date).format()}`)
              },
              eventClick: (eventClickInfo) => {
                // $('.tooltip').tooltip('dispose')
                templateInstance.selectedDate.set(undefined)
                templateInstance.selectedProjectId.set(undefined)
                templateInstance.tcid.set(eventClickInfo.event.id)
                $('#edit-tc-entry-modal').modal({ focus: false })
                // FlowRouter.go(`/edit/timecard/${eventClickInfo.event.id}`)
              },
              dateClick: (dateClickInfo) => {
                templateInstance.tcid.set(undefined)
                templateInstance.selectedProjectId.set('all')
                templateInstance.selectedDate.set(dateClickInfo.date)
                $('#edit-tc-entry-modal').modal({ focus: false })
                // FlowRouter.go(`/tracktime/?date=${moment(dateClickInfo.date).format()}&view=d`)
              },
            })
            templateInstance.calendar.render()
            templateInstance.calendarInitialized.set(true)
          })
        })
      })
    }
  })
  templateInstance.autorun(() => {
    templateInstance.periodTimecardsSub = templateInstance.subscribe('periodTimecards',
      {
        startDate: templateInstance.startDate.get(),
        endDate: templateInstance.endDate.get(),
        userId: Meteor.userId(),
      })
  })
  templateInstance.autorun(() => {
    if (templateInstance.calendarInitialized.get()) {
      if (templateInstance.periodTimecardsSub.ready()) {
        templateInstance.calendar.refetchEvents()
      }
    }
  })
})

Template.calendar.helpers({
  projects() {
    return Projects.find(
      {
        $or: [{ archived: { $exists: false } }, { archived: false }],
      },
      { sort: { name: 1 } },
    )
  },
  tcid: () => Template.instance().tcid,
  selectedDate: () => Template.instance().selectedDate,
  selectedProjectId: () => Template.instance().selectedProjectId,
})

Template.calendar.onDestroyed(function calendarDestroyed() {
  delete this.calendar
})
