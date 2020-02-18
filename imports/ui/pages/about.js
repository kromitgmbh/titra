import dayjs from 'dayjs'
import i18next from 'i18next'
import { emojify, getGlobalSetting } from '../../utils/frontend_helpers'
import './about.html'

Template.about.onCreated(function aboutCreated() {
  this.statistics = new ReactiveVar()
  Meteor.call('getStatistics', (error, result) => {
    if (!error) {
      this.statistics.set(result)
    } else {
      console.error(error)
    }
  })
})
Template.about.events({
  'click #retrieveChangeLog': (event, templateInstance) => {
    event.preventDefault()
    if (!templateInstance.$('#changelog').hasClass('show')) {
      $.getJSON('https://api.github.com/repos/kromitgmbh/titra/tags', (data) => {
        const tag = data[2]
        $.getJSON(tag.commit.url, (commitData) => {
          templateInstance.$('#titra-changelog').html(`Version <a href='https://github.com/kromitgmbh/titra/tags' target='_blank'>${tag.name}</a> (${dayjs(commitData.commit.committer.date).format(getGlobalSetting('dateformat'))}) :<br/>${commitData.commit.message.replace(/(:.*:)/g, emojify)}`)
        })
      }).fail(() => {
        templateInstance.$('#titra-changelog').html(i18next.t('settings.titra_changelog_error'))
      })
    }
  },
})
Template.about.helpers({
  statistics() {
    return Template.instance().statistics.get()
  },
  bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) {
      return '0 Byte'
    }
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
    return `${Math.round(bytes / Math.pow(1024, i), 2)}  ${sizes[i]}`
  },
  humanReadableTime(time) {
    const days = Math.floor(time / 86400)
    const hours = Math.floor((time % 86400) / 3600)
    const minutes = Math.floor(((time % 86400) % 3600) / 60)
    // const seconds = Math.floor(((time % 86400) % 3600) % 60)
    let out = ''
    if (days > 0) {
      out += `${days} ${i18next.t('globals.day_plural')}, `
    }
    if (hours > 0) {
      out += `${hours} ${i18next.t('globals.hour_plural')}, `
    }
    if (minutes > 0) {
      out += `${minutes} ${i18next.t('globals.minute_plural')} `
    }
    return out
  },
})
