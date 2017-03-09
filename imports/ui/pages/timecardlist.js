import { Meteor } from 'meteor/meteor'
import moment from 'moment'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { saveAs } from 'file-saver'
import Timecards from '../../api/timecards/timecards.js'
import Projects from '../../api/projects/projects.js'

import './timecardlist.html'
import '../components/periodpicker.js'
import '../components/resourceselect.js'

const base64toBlob = (base64Data, contentTypeArgument) => {
  check(base64Data, String)
  check(contentTypeArgument, Match.OneOf(undefined, null, String))
  const contentType = contentTypeArgument || ''
  const sliceSize = 1024
  const byteCharacters = atob(base64Data)
  const bytesLength = byteCharacters.length
  const slicesCount = Math.ceil(bytesLength / sliceSize)
  const byteArrays = new Array(slicesCount)

  for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    const begin = sliceIndex * sliceSize
    const end = Math.min(begin + sliceSize, bytesLength)

    const bytes = new Array(end - begin)
    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0)
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes)
  }
  return new Blob(byteArrays, { type: contentType })
}

Template.timecardlist.onCreated(function createTimeCardList() {
  this.period = new ReactiveVar('currentMonth')
  this.resource = new ReactiveVar('all')
  this.project = new ReactiveVar(FlowRouter.getParam('projectId'))
  this.autorun(() => {
    this.subscribe('projectTimecards', { projectId: this.project.get(), period: this.period.get(), userId: this.resource.get() })
    this.subscribe('projectUsers', { projectId: this.project.get() })
  })
})
Template.timecardlist.helpers({
  timecards() {
    return Timecards.findOne() ? Timecards.find({}, { sort: { date: -1 } }) : false
  },
  prettify(date) {
    return moment(date).format('DD.MM.YYYY')
  },
  selectedProjectId() {
    return Template.instance().project.get() !== 'all' ? Template.instance().project.get() : ''
  },
  projectName(_id) {
    return Projects.findOne({ _id }) ? Projects.findOne({ _id }).name : false
  },
  totalHours() {
    let hoursCount = 0
    for (const timecard of Timecards.find().fetch()) {
      hoursCount += Number.parseFloat(timecard.hours)
    }
    return hoursCount
  },
  username(_id) {
    const meteorUser = Meteor.users.findOne({ _id })
    return meteorUser ? meteorUser.profile.name : false
  },
})

Template.timecardlist.events({
  'change #period': (event, templateInstance) => {
    templateInstance.period.set($(event.currentTarget).val())
  },
  'change #resourceselect': (event, templateInstance) => {
    templateInstance.resource.set($(event.currentTarget).val())
  },
  'change #targetProject': (event, templateInstance) => {
    templateInstance.project.set($(event.currentTarget).val())
    // FlowRouter.go(`/list/timecards/${$(event.currentTarget).val()}`)
  },
  'click .js-delete-timecard': (event) => {
    event.preventDefault()
    Meteor.call('deleteTimeCard', { timecardId: event.currentTarget.parentNode.parentNode.id }, (error, result) => {
      if (!error) {
        $.notify('Time entry deleted')
      } else {
        console.error(error)
      }
    })
  },
  'click #export': (event) => {
    event.preventDefault()
    Meteor.call('export', { projectId: $('#targetProject').val(), timePeriod: $('#period').val(), userId: $('#resourceselect').val() }, (error, result) => {
      if (!error) {
        let prjName = 'allprojects'
        if ($('#targetProject').val() !== 'all') {
          prjName = $('#targetProject').children(':selected').text()
          if (prjName.length > 12 && prjName.split(' ').length > 0) {
            const tmpPrjNameArray = prjName.split(' ')
            prjName = ''
            for (const part of tmpPrjNameArray) {
              prjName += part.substring(0, 1)
            }
          }
        }
        saveAs(new Blob([result], { type: 'application/vnd.ms-excel' }), `titra_export_${prjName}_${moment().format('YYYYMMDD-HHmm')}.xls`)
        // console.log(result)
      } else {
        console.error(error)
      }
    })
  },
})
