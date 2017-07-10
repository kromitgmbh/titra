
// Import to load these templates

import './useraccounts-configuration.js'
import './routes.js'
import './startup.js'

import('tether').then((Tether) => {
  window.Tether = Tether.default
  import('bootstrap')
})
