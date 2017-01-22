import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import moment from 'moment'
import './timetracker.html'

Template.timetracker.onCreated(function () {
  this.timer = new ReactiveVar(null);
})

Template.timetracker.events({
  'click .js-stop' (event) {
    event.preventDefault()
    alert('wow, you tracked ' + moment.duration(moment().valueOf() - Template.instance().timer.get().valueOf()).asSeconds() + " seconds")
    //todo: here is where the magic should happen
    // i.e. redirect to the tracktime page prefilled with what we tracked so far
    Meteor.clearTimeout(Template.instance().intervalHandle)
    Template.instance().timer.set(null)
  },
  'click .js-start' (event) {
    event.preventDefault()
    Template.instance().timer.set(moment())
    let timer = Template.instance().timer.get()
    Template.instance().intervalHandle = Meteor.setInterval(function () {
      // console.log(timer)
      let duration = moment.duration(moment().valueOf() - timer.get().valueOf())
      this.$('.js-timer').text(pad(duration.hours(),2) + ":" + pad(duration.minutes(),2) + ":" + pad(duration.seconds(),2))
    }, 1000)
  },
})

Template.timetracker.helpers({
  timerIsRunning(){
    return Template.instance().timer.get() ? true : false
  }
})

function pad(num, size) {
    var s = "0000" + num;
    return s.substr(s.length-size);
}
