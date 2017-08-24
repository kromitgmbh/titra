
// Import to load these templates
// import Popper from 'popper.js'
import './useraccounts-configuration.js'
import './routes.js'
import './startup.js'

import('popper.js').then((Popper) => {
  // window.Tether = Tether.default
  window.Popper = Popper.default
  import('bootstrap')
})
