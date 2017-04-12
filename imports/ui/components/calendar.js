import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import moment from 'moment'
import Timecards from '../../api/timecards/timecards.js'
import Projects from '../../api/projects/projects.js'
import './calendar.html'
import 'fullcalendar'
import 'fullcalendar/dist/fullcalendar.css'

import hex2rgba from '../../utils/hex2rgba.js'


Template.calendar.onCreated(function calendarCreated() {
  this.subscribe('myprojects');
})

Template.calendar.onRendered(function trackmonthRendered() {
  let self = this;
  self.fc = $('#cal');
  self.autorun(() => {
    //let periodTimecardsSub = self.subscribe('periodTimecards', {startDate: moment().startOf('month').toDate(), endDate: moment().endOf('month').toDate(), userId: 'all'})
    self.fc.fullCalendar({
      header: { center: 'month,basicWeek' },
      eventClick: function(calEvent, jsEvent, view) {
        $(this).tooltip('hide')
      },
      eventRender: function(event, element, view) {
        //element.text('bala')
        element.tooltip({
          html: true,
          placement: 'right',
          trigger : 'hover',
          title: '<table><tr><td style="">'+event.title+'</td></tr><tr><td>'+event.hours+' hours</td></tr></table>',
        })
      },
      events: function (start, end, tz, callback) {
        //subscribe only to specified date range
        self.periodTimecardsSub = self.subscribe('periodTimecards', {startDate: start.toDate(), endDate: end.toDate(), userId: 'all'})
        //find all, because we've already subscribed to a specific range
        var events = Timecards.find().map(function (it) {
          return {
            id: it._id,
            title: it.task,
            start: it.date,
            hours: it.hours,
            color: hex2rgba(Projects.findOne({ _id: it.projectId }).color, 40),
            url: '/edit/timecard/'+it._id,
            allDay: true
          };
        });
        callback(events);
      }
    })
    if (self.periodTimecardsSub.ready()) {
      self.fc.fullCalendar('refetchEvents');
    }
  })
})

Template.calendar.helpers({
  projects() {
    return Projects.find({}, { sort: { name: 1 } })
  },
  colorOpacity(hex, op) {
    return hex2rgba(hex, !isNaN(op) ? op : 50)
  },
});
