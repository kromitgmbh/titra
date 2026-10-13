import dayjs from 'dayjs'
import { t } from '../../utils/i18n.js'
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
      const changelog = templateInstance.$('#titra-changelog')
      changelog.text(t('globals.loading'))
      $.getJSON('https://api.github.com/repos/titraio/titra/releases/latest')
        .done((release) => {
          if (!release?.tag_name) {
            changelog.text(t('settings.titra_changelog_error'))
            return
          }

          const releaseDate = release.published_at
            ? ` (${dayjs(release.published_at).format(getGlobalSetting('dateformat'))})`
            : ''
          emojify(release.body || '').then((releaseNotes) => {
            const releaseLink = $('<a/>', {
              href: `https://github.com/titraio/titra/releases/tag/${encodeURIComponent(release.tag_name)}`,
              target: '_blank',
              rel: 'noopener noreferrer',
            }).text(release.tag_name)
            changelog.empty()
              .append(document.createTextNode('Version '))
              .append(releaseLink)
              .append(document.createTextNode(`${releaseDate} :\n${releaseNotes}`))
          }).catch(() => {
            changelog.text(t('settings.titra_changelog_error'))
          })
        })
        .fail(() => {
          changelog.text(t('settings.titra_changelog_error'))
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
      out += `${days} ${t('globals.day_plural')}, `
    }
    if (hours > 0) {
      out += `${hours} ${t('globals.hour_plural')}, `
    }
    if (minutes > 0) {
      out += `${minutes} ${t('globals.minute_plural')} `
    }
    return out
  },
})
