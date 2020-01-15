import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import moment from 'moment'
import i18next from 'i18next'
import namedavatar from 'namedavatar'
import '@simonwep/pickr/dist/themes/monolith.min.css'
import Pickr from '@simonwep/pickr/dist/pickr.min'
import './settings.html'
import '../components/backbutton.js'

// Shortcuts - check https://keycode.info/ for keycodes
document.onkeyup = (e) => {
  if (e.which === 83 && e.ctrlKey && e.shiftKey) {
    $('.js-save').click()
    // location.reload()
  }
}

Template.settings.helpers({
  name: () => (Meteor.user() ? Meteor.user().profile.name : false),
  unit() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.unit ? Meteor.user().profile.unit : '$'
    }
    return false
  },
  timetrackview() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd'
    }
    return false
  },
  hoursToDays() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : 8
    }
    return false
  },
  displayHoursToDays: () => Template.instance().displayHoursToDays.get(),
  enableWekan() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile ? Meteor.user().profile.enableWekan : false
    }
    return false
  },
  precision() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.precision ? Meteor.user().profile.precision : '2'
    }
    return false
  },
  svgAvatar() {
    namedavatar.config({
      nameType: 'initials',
      backgroundColors:
        [(Meteor.user() && Meteor.user().profile.avatarColor
          ? Meteor.user().profile.avatarColor : Template.instance().selectedAvatarColor.get())],
      minFontSize: 2,
    })
    const rawSVG = namedavatar.getSVG(Meteor.user() ? Meteor.user().profile.name : false)
    rawSVG.classList = 'rounded'
    rawSVG.style.width = '100px'
    rawSVG.style.height = '100px'
    return rawSVG.outerHTML
  },
  siwappurl: () => (Meteor.user() ? Meteor.user().profile.siwappurl : false),
  siwapptoken: () => (Meteor.user() ? Meteor.user().profile.siwapptoken : false),
  titraAPItoken: () => (Meteor.user() ? Meteor.user().profile.APItoken : false),
  dailyStartTime: () => (Meteor.user() ? Meteor.user().profile.dailyStartTime : '09:00'),
  breakStartTime: () => (Meteor.user() ? Meteor.user().profile.breakStartTime : '12:00'),
  breakDuration: () => (Meteor.user() ? Meteor.user().profile.breakDuration : 1),
  regularWorkingTime: () => (Meteor.user() ? Meteor.user().profile.regularWorkingTime : 8),
  avatarColor: () => (Meteor.user() && Meteor.user().profile.avatarColor
    ? Meteor.user().profile.avatarColor : Template.instance().selectedAvatarColor.get()),
})


Template.settings.events({
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('updateSettings', {
      name: templateInstance.$('#name').val(),
      unit: templateInstance.$('#unit').val(),
      timeunit: templateInstance.$('#timeunit').val(),
      timetrackview: templateInstance.$('#timetrackview').val(),
      hoursToDays: Number(templateInstance.$('#hoursToDays').val()),
      enableWekan: templateInstance.$('#enableWekan').is(':checked'),
      precision: Number(templateInstance.$('#precision').val()),
      siwapptoken: templateInstance.$('#siwapptoken').val(),
      siwappurl: templateInstance.$('#siwappurl').val(),
      APItoken: templateInstance.$('#titraAPItoken').val(),
      theme: templateInstance.$('#theme').val(),
      language: templateInstance.$('#language').val(),
      dailyStartTime: templateInstance.$('#dailyStartTime').val(),
      breakStartTime: templateInstance.$('#breakStartTime').val(),
      breakDuration: templateInstance.$('#breakDuration').val(),
      regularWorkingTime: templateInstance.$('#regularWorkingTime').val(),
      avatar: templateInstance.$('#avatarData').val(),
      avatarColor: templateInstance.$('#avatarColor').val(),
    },
    (error) => {
      if (error) {
        $.notify({ message: i18next.t(error.error) }, { type: 'danger' })
      } else {
        $.notify(i18next.t('notifications.settings_saved_success'))
        $('#imagePreview').hide()
      }
    })
  },
  'change #timeunit': (event, templateInstance) => {
    Template.instance().displayHoursToDays.set(
      templateInstance.$('#timeunit').val() === 'd',
    )
  },
  'click .js-logout': (event) => {
    event.preventDefault()
    Meteor.logout()
  },
  'click #generateToken': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('#titraAPItoken').val(Random.id())
  },
  'change #avatarImage': (event, templateInstance) => {
    if (event.currentTarget.files && event.currentTarget.files[0]) {
      const reader = new FileReader()
      reader.onloadend = (callbackresult) => {
        const image = new Image()
        image.onload = () => {
          const maxHeight = 125
          const maxWidth = 125
          const resizeCanvas = document.createElement('canvas')
          let ratio = 1
          if (image.height > maxHeight) {
            ratio = maxHeight / image.height
          } else if (image.width > maxWidth) {
            ratio = maxWidth / image.width
          }
          if (resizeCanvas) {
            resizeCanvas.width = image.width * ratio
            resizeCanvas.height = image.height * ratio
            resizeCanvas
              .getContext('2d')
              .drawImage(image, 0, 0, resizeCanvas.width, resizeCanvas.height)
            const dataURL = resizeCanvas.toDataURL('image/png')
            templateInstance.$('#imagePreview img').attr('src', dataURL)
            templateInstance.$('#avatarData').val(dataURL)
            templateInstance.$('#imagePreview').show()
          } else {
            console.error('unable to create Canvas')
          }
        }
        image.src = callbackresult.target.result
      }
      reader.readAsDataURL(event.currentTarget.files[0])
    }
  },
  'click #removeAvatar': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('#avatarData').val('')
    templateInstance.$('.js-save').click()
  },
})
Template.settings.onCreated(function settingsCreated() {
  this.displayHoursToDays = new ReactiveVar()
  this.selectedAvatarColor = new ReactiveVar('#455A64')
  this.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      if (Meteor.user().profile) {
        this.displayHoursToDays.set(Meteor.user().profile.timeunit === 'd')
      }
    }
  })
})
Template.settings.onRendered(function settingsRendered() {
  import('node-emoji').then((emojiImport) => {
    const emoji = emojiImport.default
    const replacer = (match) => emoji.emojify(match)
    $.getJSON('https://api.github.com/repos/kromitgmbh/titra/tags', (data) => {
      const tag = data[2]
      $.getJSON(tag.commit.url, (commitData) => {
        $('#titra-changelog').html(`Version <a href='https://github.com/kromitgmbh/titra/tags' target='_blank'>${tag.name}</a> (${moment(commitData.commit.committer.date).format('DD.MM.YYYY')}) :<br/>${commitData.commit.message.replace(/(:.*:)/g, replacer)}`)
      })
    }).fail(() => {
      $('#titra-changelog').html(i18next.t('settings.titra_changelog_error'))
    })
  })
  this.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user()
      && Meteor.user().profile && this.subscriptionsReady()) {
      $('#timeunit').val(Meteor.user().profile.timeunit ? Meteor.user().profile.timeunit : 'h')
      $('#timetrackview').val(Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd')
      $('#theme').val(Meteor.user().profile.theme ? Meteor.user().profile.theme : 'auto')
      $('#language').val(Meteor.user().profile.language ? Meteor.user().profile.language : 'auto')
      $('#dailyStartTime').val(Meteor.user().profile.dailyStartTime ? Meteor.user().profile.dailyStartTime : '09:00')
      $('#breakStartTime').val(Meteor.user().profile.breakStartTime ? Meteor.user().profile.breakStartTime : '12:00')
      $('#breakDuration').val(Meteor.user().profile.breakDuration ? Meteor.user().profile.breakDuration : 0.5)
      $('#regularWorkingTime').val(Meteor.user().profile.regularWorkingTime ? Meteor.user().profile.regularWorkingTime : 8)
      $('#avatarData').val(Meteor.user().profile.avatar)
      if (this.pickr) {
        this.pickr.destroy()
        delete this.pickr
      }
      if (!Meteor.user().profile.avatar && $('#avatarColorPickr').length) {
        const pickrOptions = {
          el: '#avatarColorPickr',
          theme: 'monolith',
          lockOpacity: true,
          comparison: false,
          position: 'left-start',
          default: (Meteor.user() && Meteor.user().profile.avatarColor
            ? Meteor.user().profile.avatarColor : Template.instance().selectedAvatarColor.get()),
          components: {
            preview: true,
            opacity: false,
            hue: true,
            interaction: {
              hex: false,
              input: false,
              clear: false,
              save: false,
            },
          },
        }
        this.pickr = Pickr.create(pickrOptions)
        this.pickr.on('change', (color) => {
          this.selectedAvatarColor.set(color.toHEXA().toString())
          $('#avatarColor').val(color.toHEXA().toString())
        })
      }
    }
  })
})
Template.settings.onDestroyed(function settingsDestroyed() {
  this.pickr.destroy()
  delete this.pickr
})
