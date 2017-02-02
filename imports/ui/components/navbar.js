import { Template } from 'meteor/templating'
import './navbar.html'

Template.navbar.onRendered(() => {
  $('.button-collapse').sideNav()
  $('.dropdown-button').dropdown()
})
