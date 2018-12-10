import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/kadira:flow-router'
import emoji from 'node-emoji'

import Timecards from '../../api/timecards/timecards.js'
import Projects from '../../api/projects/projects.js'
import './calendar.html'
import hex2rgba from '../../utils/hex2rgba.js'


Template.calendar.onCreated(function calendarCreated() {
  this.subscribe('myprojects')
})

Template.calendar.onRendered(function trackmonthRendered() {
  const replacer = match => emoji.emojify(match)
  const safeReplacer = transform => transform.replace(/(:.*:)/g, replacer).replace(/</g, '&lt;').replace(/>/, '&gt;').replace(/"/g, '&quot;')

  import('fullcalendar').then(() => {
    // import 'fullcalendar/dist/locale-all.js'
    import 'fullcalendar/dist/fullcalendar.css'
    // required for draggable feature
    import 'jquery-ui'
    import 'jquery-ui/ui/version.js'
    import 'jquery-ui/ui/data.js'
    import 'jquery-ui/ui/plugin.js'
    import 'jquery-ui/ui/safe-active-element'
    import 'jquery-ui/ui/safe-blur'
    import 'jquery-ui/ui/scroll-parent'
    import 'jquery-ui/ui/widgets/mouse.js'
    import 'jquery-ui/ui/widgets/draggable.js'
    //
    this.fc = $('#cal')
    this.autorun(() => {
      // let periodTimecardsSub = self.subscribe('periodTimecards',
      // {startDate: moment().startOf('month').toDate(),
      // endDate: moment().endOf('month').toDate(), userId: 'all'})
      this.fc.fullCalendar({
        // header: { center: 'month,basicWeek' },
        firstDay: 1,
        droppable: true,
        drop: function dropEvent(date) {
          FlowRouter.go(`/tracktime/${$(this).data('id')}?date=${date.format()}`)
        },
        eventClick: (calEvent, jsEvent, view) => {
          $('.tooltip').tooltip('dispose')
          FlowRouter.go(`/edit/timecard/${calEvent.id}`)
        },
        dayClick: (date, jsEvent, view) => {
          FlowRouter.go(`/tracktime/?date=${date.format()}&view=d`)
        },
        eventRender: (event, element, view) => {
          // element.text('bala')
          if (window.innerWidth >= 768) {
            element.tooltip({
              html: true,
              placement: 'right',
              trigger: 'hover',
              title: `<table><tr><td style="">${safeReplacer(event.title)}</td></tr><tr><td>${event.hours} hours</td></tr></table>`,
            })
          }
        },
        events: (start, end, tz, callback) => {
          // subscribe only to specified date range
          this.periodTimecardsSub = this.subscribe('periodTimecards', { startDate: start.toDate(), endDate: end.toDate(), userId: Meteor.userId() })
          // find all, because we've already subscribed to a specific range
          const events = Timecards.find().map(it => (
            {
              id: it._id,
              title: it.task,
              start: it.date,
              hours: it.hours,
              color: hex2rgba(Projects.findOne({ _id: it.projectId }).color ? Projects.findOne({ _id: it.projectId }).color : '#009688', 40),
              // url: `/edit/timecard/${it._id}`,
              allDay: true,
            }))
          callback(events)
        },
      })
      if (this.periodTimecardsSub.ready()) {
        this.fc.fullCalendar('refetchEvents')
        $('.drag').draggable({
          revert: true,
          revertDuration: 0,
          helper: 'clone',
          appendTo: '#cal',
        })
      }
    })
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
  colorOpacity(hex, op) {
    return hex2rgba(hex || '#009688', !isNaN(op) ? op : 50)
  },
})
