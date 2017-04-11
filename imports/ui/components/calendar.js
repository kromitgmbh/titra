import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import moment from 'moment'
import Timecards from '../../api/timecards/timecards.js'
import './calendar.html'
import 'fullcalendar'
import 'fullcalendar/dist/fullcalendar.css'


Template.calendar.onRendered(function trackmonthRendered() {
  let self = this;
  self.fc = $('#cal');
  self.autorun(() => {
    //let periodTimecardsSub = self.subscribe('periodTimecards', {startDate: moment().startOf('month').toDate(), endDate: moment().endOf('month').toDate(), userId: 'all'})
    self.fc.fullCalendar({
      header: { center: 'month,basicWeek' },
      events: function (start, end, tz, callback) {
        //subscribe only to specified date range
        self.periodTimecardsSub = self.subscribe('periodTimecards', {startDate: start.toDate(), endDate: end.toDate(), userId: 'all'})
        //find all, because we've already subscribed to a specific range
        var events = Timecards.find().map(function (it) {
            return {
                title: it.task,
                start: it.date,
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
/*
Template.calendar.helpers({
  events: function () {
      var fc = $('#cal');
      return function (start, end, tz, callback) {
          //subscribe only to specified date range
          Meteor.subscribe('periodTimecards', start.toDate(), end.toDate(), 'all', function () {
              //trigger event rendering when collection is downloaded
              fc.fullCalendar('refetchEvents');
          });

          //find all, because we've already subscribed to a specific range
          var events = Timecards.find().map(function (it) {
              return {
                  title: it.date.toISOString(),
                  start: it.date,
                  allDay: true
              };
          });
          console.log(events)
          callback(events);
      };
  },
  onEventClicked: function() {
      return function(calEvent, jsEvent, view) {
          alert("Event clicked: "+calEvent.title);
      }
  }
});
*/