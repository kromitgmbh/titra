import { Accounts } from 'meteor/accounts-base'
import { SHA256 } from 'meteor/sha'
import util from 'util'
import { getGlobalSettingAsync } from './server_method_helpers'

const isLogEnabled = (process.env.LDAP_LOG_ENABLED === 'true')

function log(level, message, data) {
  if (isLogEnabled) {
    console.log(`[${level}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}`)
  }
}

function logDebug(...args) { log('DEBUG', ...args) }
function logInfo(...args) { log('INFO', ...args) }
function logWarn(...args) { log('WARN', ...args) }
function logError(...args) { log('ERROR', ...args) }

class LDAP {
  constructor() {
    this.ldapjs = new Promise((resolve) => {
        import('ldapjs').then((ldapjs) => {
            resolve(ldapjs.default)
        })
    })
    this.connected = false
    this.options = {
      host: this.constructor.getSettings('LDAP_HOST'),
      port: this.constructor.getSettings('LDAP_PORT'),
      Reconnect: this.constructor.getSettings('LDAP_RECONNECT'),
      timeout: this.constructor.getSettings('LDAP_TIMEOUT') || 10000,
      connect_timeout: this.constructor.getSettings('LDAP_CONNECT_TIMEOUT') || 10000,
      idle_timeout: this.constructor.getSettings('LDAP_IDLE_TIMEOUT'),
      encryption: this.constructor.getSettings('LDAP_ENCRYPTION'),
      ca_cert: this.constructor.getSettings('LDAP_CA_CERT'),
      reject_unauthorized: this.constructor.getSettings('LDAP_REJECT_UNAUTHORIZED') !== undefined ? this.constructor.getSettings('LDAP_REJECT_UNAUTHORIZED') : true,
      Authentication_UserDN: this.constructor.getSettings('LDAP_AUTHENTICATION_USERDN') || this.constructor.getSettings('LDAP_BASEDN'),
      Authentication_Password: this.constructor.getSettings('LDAP_AUTHENTICATION_PASSWORD'),
      Authentication_Fallback: this.constructor.getSettings('LDAP_LOGIN_FALLBACK'),
      BaseDN: this.constructor.getSettings('LDAP_BASEDN'),
      User_Authentication: this.constructor.getSettings('LDAP_USER_AUTHENTICATION') || this.constructor.getSettings('LDAP_USERNAME_FIELD') || 'uid',
      User_Authentication_Field: this.constructor.getSettings('LDAP_USER_AUTHENTICATION_FIELD') || 'uid',
      User_Attributes: this.constructor.getSettings('LDAP_USER_ATTRIBUTES'),
      User_Search_Filter: this.constructor.getSettings('LDAP_USER_SEARCH_FILTER'),
      User_Search_Scope: this.constructor.getSettings('LDAP_USER_SEARCH_SCOPE'),
      User_Search_Field: this.constructor.getSettings('LDAP_USER_SEARCH_FIELD') || this.constructor.getSettings('LDAP_USERNAME_FIELD') || 'uid',
      Search_Page_Size: this.constructor.getSettings('LDAP_SEARCH_PAGE_SIZE'),
      Search_Size_Limit: this.constructor.getSettings('LDAP_SEARCH_SIZE_LIMIT'),
      group_filter_enabled: this.constructor.getSettings('LDAP_GROUP_FILTER_ENABLE'),
      group_filter_object_class: this.constructor.getSettings('LDAP_GROUP_FILTER_OBJECTCLASS'),
      group_filter_group_id_attribute: this.constructor.getSettings('LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE'),
      group_filter_group_member_attribute: this.constructor.getSettings('LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE'),
      group_filter_group_member_format: this.constructor.getSettings('LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT'),
      group_filter_group_name: this.constructor.getSettings('LDAP_GROUP_FILTER_GROUP_NAME'),
      UsernameField: LDAP.getSettings('LDAP_USERNAME_FIELD') || 'uid',
    }
  }

  static getSettings(name, ...args) {
    let value = process.env[name]
    if (value !== undefined) {
      if (value === 'true' || value === 'false') {
        value = JSON.parse(value)
      } else if (value !== '' && !isNaN(value)) {
        value = Number(value)
      }
      return value
    }
    logWarn(`Lookup for unset variable: ${name}`)
    return undefined
  }

  // connectSync(...args) {
  //   if (!this._connectSync) {
  //     this._connectSync = Meteor.wrapAsync(this.connectAsync, this)
  //   }
  //   return this._connectSync(...args)
  // }

  // searchAllSync(...args) {
  //   if (!this._searchAllSync) {
  //     this._searchAllSync = await this.searchAllAsync
  //   }
  //   return this._searchAllSync(...args)
  // }

  async connectAsync() {
      logInfo('Init setup')

      let replied = false

      const connectionOptions = {
        url: `${this.options.host}:${this.options.port}`,
        timeout: this.options.timeout,
        connectTimeout: this.options.connect_timeout,
        idleTimeout: this.options.idle_timeout,
        reconnect: this.options.Reconnect,
      }

      const tlsOptions = {
        rejectUnauthorized: this.options.reject_unauthorized,
      }

      if (this.options.ca_cert && this.options.ca_cert !== '') {
        // Split CA cert into array of strings
        const chainLines = this.constructor.getSettings('LDAP_CA_CERT').replace(/\\n/g, '\n').split('\n')
        let cert = []
        const ca = []
        chainLines.forEach((line) => {
          cert.push(line)
          if (line.match(/-END CERTIFICATE-/)) {
            ca.push(cert?.join('\n'))
            cert = []
          }
        })
        tlsOptions.ca = ca
      }

      if (this.options.encryption === 'ssl') {
        connectionOptions.url = `ldaps://${connectionOptions.url}`
        connectionOptions.tlsOptions = tlsOptions
      } else {
        connectionOptions.url = `ldap://${connectionOptions.url}`
      }

      logInfo('Connecting', connectionOptions.url)
      logDebug(`connectionOptions${util.inspect(connectionOptions)}`)

      const localLdapJs = await this.ldapjs
        this.client = localLdapJs.createClient(connectionOptions)

      this.bindAsync = (dn, password) => {
        return new Promise((resolve, reject) => {
          this.client.bind(dn, password, (error, result) => {
            if (error) {
              reject(error)
            } else {
              resolve(result)
            }
          })
        })
      };
      return new Promise((resolve, reject) => {

      this.client.on('error', (error) => {
        logError('connection', error)
        if (replied === false) {
          replied = true
          reject(error)
        }
      })

      this.client.on('idle', () => {
        logInfo('Idle')
        this.disconnect()
      })

      this.client.on('close', () => {
        logInfo('Closed')
      })

      if (this.options.encryption === 'tls') {
        // Set host parameter for tls.connect which is used by ldapjs starttls. This shouldn't be needed in newer nodejs versions (e.g v5.6.0).
        // https://github.com/RocketChat/Rocket.Chat/issues/2035
        // https://github.com/mcavage/node-ldapjs/issues/349
        tlsOptions.host = this.options.host

        logInfo('Starting TLS')
        logDebug('tlsOptions', tlsOptions)

        this.client.starttls(tlsOptions, null, (error, response) => {
          if (error) {
            logError('TLS connection', error)
            if (replied === false) {
              replied = true
              reject(error)
            }
            return
          }

          logInfo('TLS connected')
          this.connected = true
          if (replied === false) {
            replied = true
            resolve(response)
          }
        })
      } else {
        this.client.on('connect', (response) => {
          logInfo('LDAP connected')
          this.connected = true
          if (replied === false) {
            replied = true
            resolve(response)
          }
        })
      }

      setTimeout(() => {
        if (replied === false) {
          logError('connection time out', connectionOptions.connectTimeout)
          replied = true
          reject(new Error('Timeout'))
        }
      }, connectionOptions.connectTimeout)
    })
  }

  getUserFilter(username) {
    const filter = []

    if (this.options.User_Search_Filter !== '' && this.options.User_Search_Filter !== undefined) {
      if (this.options.User_Search_Filter[0] === '(') {
        filter.push(`${this.options.User_Search_Filter}`)
      } else {
        filter.push(`(${this.options.User_Search_Filter})`)
      }
    }
    const usernameFilter = this.options.User_Search_Field ? this.options.User_Search_Field.split(',').map((item) => `(${item}=${username})`) : this.options.UsernameField.split(',').map((item) => `(${item}=${username})`)
    if (usernameFilter === undefined || usernameFilter?.length === 0) {
      logError('LDAP_User_Search_Field not defined')
    } else if (usernameFilter?.length === 1) {
      filter.push(`${usernameFilter[0]}`)
    } else {
      filter.push(`(|${usernameFilter?.join('')})`)
    }
    return filter?.length > 0 ? `(&${filter?.join('')})` : ''
  }

  async bindUserIfNecessary(username, password) {
    if (this.domainBinded === true) {
      return
    }

    if (!this.options.User_Authentication) {
      return
    }

    if (!this.options.BaseDN) throw new Error('BaseDN is not provided')

    const userDn = `${this.options.User_Authentication_Field}=${username},${this.options.BaseDN}`

    await this.bindAsync(userDn, password)
    this.domainBinded = true
  }

  async bindIfNecessary() {
    if (this.domainBinded === true) {
      return
    }
    logInfo('Binding UserDN', this.options.Authentication_UserDN)

    await this.bindAsync(this.options.Authentication_UserDN, this.options.Authentication_Password)
    this.domainBinded = true
  }

  async searchUsersAsync(username, page) {
    await this.bindIfNecessary()
    const filter = this.getUserFilter(username)
    const sizeLimit = this.options.Search_Size_Limit
    const searchOptions = {
      scope: this.options.User_Search_Scope || 'sub'
    }
    if (filter && filter !== '') {
      searchOptions.filter = filter
    }
    if (sizeLimit && sizeLimit !== '') {
      searchOptions.sizeLimit = sizeLimit
    }
    if (this.options.User_Attributes) searchOptions.attributes = this.options.User_Attributes.split(',')

    if (this.options.Search_Page_Size > 0) {
      searchOptions.paged = {
        pageSize: this.options.Search_Page_Size,
        pagePause: !!page,
      }
    }

    logInfo('Searching user', username)
    logDebug('searchOptions', searchOptions)
    logDebug('BaseDN', this.options.BaseDN)

    if (page) {
      return this.searchAllPaged(this.options.BaseDN, searchOptions, page)
    }

    return this.searchAllAsync(this.options.BaseDN, searchOptions)
  }

  async getUserByIdAsync(id, attribute) {
    await this.bindIfNecessary()

    const Unique_Identifier_Field = this.constructor.getSettings('LDAP_UNIQUE_IDENTIFIER_FIELD').split(',')

    let filter

    if (attribute) {
      filter = new this.ldapjs.filters.EqualityFilter({
        attribute,
        value: Buffer.from(id, 'hex'),
      })
    } else {
      const filters = []
      Unique_Identifier_Field.forEach((item) => {
        filters.push(new this.ldapjs.filters.EqualityFilter({
          attribute: item,
          value: Buffer.from(id, 'hex'),
        }))
      })

      filter = new this.ldapjs.filters.OrFilter({ filters })
    }

    const searchOptions = {
      filter,
      scope: 'sub',
    }

    logInfo('Searching by id', id)
    logDebug('search filter', searchOptions.filter.toString())
    logDebug('BaseDN', this.options.BaseDN)

    const result = await this.searchAllAsync(this.options.BaseDN, searchOptions)

    if (!Array.isArray(result) || result.length === 0) {
      return
    }

    if (result?.length > 1) {
      logError('Search by id', id, 'returned', result.length, 'records')
    }
    return result[0]
  }

  async getUserByUsernameSync(username) {
    await this.bindIfNecessary()

    const searchOptions = {
      filter: this.getUserFilter(username),
      scope: this.options.User_Search_Scope || 'sub',
    }

    logInfo('Searching user', username)
    logDebug('searchOptions', searchOptions)
    logDebug('BaseDN', this.options.BaseDN)

    const result = await this.searchAllAsync(this.options.BaseDN, searchOptions)
    logDebug('searchAllAsync result', result)
    if (!Array.isArray(result) || result?.length === 0) {
      return
    }

    if (result?.length > 1) {
      logError('Search by username', username, 'returned', result.length, 'records')
    }
    return result[0]
  }

  async getUserGroups(username, ldapUser) {
    if (!this.options.group_filter_enabled) {
      return true
    }

    const filter = ['(&']

    if (this.options.group_filter_object_class !== '') {
      filter.push(`(objectclass=${this.options.group_filter_object_class})`)
    }

    if (this.options.group_filter_group_member_attribute !== '') {
      const format_value = ldapUser[this.options.group_filter_group_member_format]
      if (format_value) {
        filter.push(`(${this.options.group_filter_group_member_attribute}=${format_value})`)
      }
    }

    filter.push(')')

    const searchOptions = {
      filter: filter?.join('').replace(/#{username}/g, username),
      scope: 'sub',
    }

    logDebug('Group list filter LDAP:', searchOptions.filter)

    const result = await this.searchAllAsync(this.options.BaseDN, searchOptions)

    if (!Array.isArray(result) || result?.length === 0) {
      return []
    }

    const grp_identifier = this.options.group_filter_group_id_attribute || 'cn'
    const groups = []
    result.map((item) => {
      groups.push(item[grp_identifier])
    })
    logDebug(`Groups: ${groups?.join(', ')}`)
    return groups
  }

  async isUserInGroup(username, ldapUser) {
    if (!this.options.group_filter_enabled) {
      return true
    }

    const grps = await this.getUserGroups(username, ldapUser)

    const filter = ['(&']

    if (this.options.group_filter_object_class !== '') {
      filter.push(`(objectclass=${this.options.group_filter_object_class})`)
    }

    if (this.options.group_filter_group_member_attribute !== '') {
      const format_value = ldapUser[this.options.group_filter_group_member_format]
      if (format_value) {
        filter.push(`(${this.options.group_filter_group_member_attribute}=${format_value})`)
      }
    }

    if (this.options.group_filter_group_id_attribute !== '') {
      filter.push(`(${this.options.group_filter_group_id_attribute}=${this.options.group_filter_group_name})`)
    }
    filter.push(')')

    const searchOptions = {
      filter: filter?.join('').replace(/#{username}/g, username),
      scope: 'sub',
    }

    logDebug('Group filter LDAP:', searchOptions.filter)

    const result = await this.searchAllAsync(this.options.BaseDN, searchOptions)

    if (!Array.isArray(result) || result?.length === 0) {
      return false
    }
    return true
  }

extractLdapEntryData(entry) {
    try {
        const returnValues = {}

        entry.attributes.forEach(attribute => {
            const { type, values } = attribute
            returnValues[type] = values
        })
        returnValues.dn = entry.objectName
        return returnValues
    } catch (error) {
        logError('Error extracting LDAP entry data:', error)
        return undefined
    }
}

  async searchAllPaged(BaseDN, options, page) {
    await this.bindIfNecessary()

    const processPage = ({
      entries, title, end, next,
    }) => {
      logInfo(title)
      // Force LDAP idle to wait the record processing
      this.client._updateIdle(true)
      page(null, entries, {
        end,
        next: () => {
          // Reset idle timer
          this.client._updateIdle()
          next && next()
        },
      })
    }

    this.client.search(BaseDN, options, (error, res) => {
      if (error) {
        logError('ldapjs client search error:' + error)
        page(error)
        return
      }

      res.on('error', (error) => {
        logError('Error reading ldapjs response: ' + error)
        page(error)
      })

      let entries = []

      const internalPageSize = options.paged && options.paged.pageSize > 0
        ? options.paged.pageSize * 2 : 500

      res.on('searchEntry', (entry) => {
        const extractLdapEntryData = this.extractLdapEntryData(entry)
        if(extractLdapEntryData) {
          entries.push(extractLdapEntryData)
        }
        if (entries?.length >= internalPageSize) {
          processPage({
            entries,
            title: 'Internal Page',
            end: false,
          })
          entries = []
        }
      })

      res.on('page', (result, next) => {
        if (!next) {
          this.client._updateIdle(true)
          processPage({
            entries,
            title: 'Final Page',
            end: true,
          })
        } else if (entries?.length) {
          logInfo('Page')
          processPage({
            entries,
            title: 'Page',
            end: false,
            next,
          })
          entries = []
        }
      })

      res.on('end', () => {
        if (entries?.length) {
          processPage({
            entries,
            title: 'Final Page',
            end: true,
          })
          entries = []
        }
      })
    })
  }

  async searchAllAsync(BaseDN, options) {
    await this.bindIfNecessary()
    return new Promise((resolve, reject) => {
      this.client.search(BaseDN, options, (error, res) => {
        if (error) {
          logError(error)
          reject(error)
          return
        }
        res.on('error', (error) => {
          logError(error)
          reject(error)
        })
        const entries = []
        res.on('searchEntry', (entry) => {
          const extractLdapEntryData = this.extractLdapEntryData(entry.pojo)
          if(extractLdapEntryData) {
            entries.push(extractLdapEntryData)
          }
        })
        res.on('end', () => {
          logInfo('Search result count', entries.length)
          resolve(entries)
        })
      })
    })
  }

  async authAsync(dn, password) {
    logInfo('Authenticating', dn)

    try {
      if (password === '') {
        throw new Error('Password is not provided')
      }
      await this.bindAsync(dn, password)
      logInfo('Authenticated', dn)
      return true
    } catch (error) {
      logInfo('Not authenticated', dn)
      logDebug('error', error)
      return false
    }
  }

  disconnect() {
    this.connected = false
    this.domainBinded = false
    logInfo('Disconecting')
    this.client.unbind()
  }
}

function getLdapUsername(ldapUser) {
  const usernameField = LDAP.getSettings('LDAP_USERNAME_FIELD') || 'uid'

  if (usernameField.indexOf('#{') > -1) {
    return usernameField.replace(/#{(.+?)}/g, (match, field) => ldapUser[field])
  }
  return ldapUser[usernameField]
}

function getLdapEmail(ldapUser) {
  const emailField = LDAP.getSettings('LDAP_EMAIL_FIELD') || 'mail'

  if (emailField?.indexOf('#{') > -1) {
    return emailField.replace(/#{(.+?)}/g, (match, field) => ldapUser[field][0])
  }

  return ldapUser[emailField][0]
}

function getLdapFullname(ldapUser) {
  const fullnameField = LDAP.getSettings('LDAP_FULLNAME_FIELD') || 'cn'
  if (fullnameField.indexOf('#{') > -1) {
    return fullnameField.replace(/#{(.+?)}/g, (match, field) => ldapUser[field][0])
  }
  return ldapUser[fullnameField][0]
}

function getLdapUserUniqueID(ldapUser) {
  let Unique_Identifier_Field = LDAP.getSettings('LDAP_UNIQUE_IDENTIFIER_FIELD') || LDAP.getSettings('LDAP_USERNAME_FIELD') || 'uid'

  if (Unique_Identifier_Field !== '' && Unique_Identifier_Field!== undefined) {
    Unique_Identifier_Field = Unique_Identifier_Field.replace(/\s/g, '').split(',')
  } else {
    Unique_Identifier_Field = []
  }

  let User_Search_Field = LDAP.getSettings('LDAP_USER_SEARCH_FIELD')

  if (User_Search_Field !== '' && User_Search_Field !== undefined) {
    User_Search_Field = User_Search_Field.replace(/\s/g, '').split(',')
  } else {
    User_Search_Field = []
  }

  Unique_Identifier_Field = Unique_Identifier_Field.concat(User_Search_Field)

  if (Unique_Identifier_Field?.length > 0) {
    Unique_Identifier_Field = Unique_Identifier_Field
      .find((field) => !isEmpty(ldapUser[field]))
    if (Unique_Identifier_Field) {
      logDebug(`Identifying user with: ${Unique_Identifier_Field}`)
      Unique_Identifier_Field = {
        attribute: Unique_Identifier_Field,
        value: ldapUser[Unique_Identifier_Field].toString('hex'),
      }
    }
    return Unique_Identifier_Field
  }
}

function fallbackDefaultAccountSystem(bind, username, password) {
  if (typeof username === 'string') {
    if (username.indexOf('@') === -1) {
      username = { username }
    } else {
      username = { email: username }
    }
  }

  logInfo('Fallback to default account system: ', username)

  const loginRequest = {
    user: username,
    password: {
      digest: SHA256(password),
      algorithm: 'sha-256',
    },
  }
  logDebug('Fallback options: ', loginRequest)

  return Accounts._runLoginHandlers(bind, loginRequest)
}
getGlobalSettingAsync('enableLDAP').then((ldapEnabled) => {
  if(ldapEnabled) {
    Accounts.registerLoginHandler('ldap', async function (loginRequest) {
      if (!loginRequest.ldap || !loginRequest.ldapOptions) {
        return undefined
      }

      logInfo('Init LDAP login', loginRequest.username)

      const self = this
      const ldap = new LDAP()
      let ldapUser

      try {
        await ldap.connectAsync()
        const user_authentication = LDAP.getSettings('LDAP_USER_AUTHENTICATION') || LDAP.getSettings('LDAP_USERNAME_FIELD') || 'uid'
        logDebug(user_authentication)
        if (user_authentication && user_authentication !== 'none') {
          await ldap.bindUserIfNecessary(loginRequest.username, loginRequest.ldapPass)
          const tempLdapUser = await ldap.searchUsersAsync(loginRequest.username)
            console.log('templLdapUser', tempLdapUser)
          ldapUser = tempLdapUser[0]
        } else {
          const users = await ldap.searchUsersAsync(loginRequest.username)
          if (users?.length !== 1) {
            logInfo('Search returned', users.length, 'record(s) for', loginRequest.username)
            throw new Error('User not Found')
          }

          if (await ldap.isUserInGroup(loginRequest.username, users[0])) {
            ldapUser = users[0]
          } else {
            throw new Error('User not in a valid group')
          }
          if (await ldap.authAsync(ldapUser.dn, loginRequest.ldapPass) !== true) {
            ldapUser = null
            logInfo('Wrong password for', loginRequest.username)
          }
        }
      } catch (error) {
        logError(error)
      }

      if (!ldapUser) {
        if (LDAP.getSettings('LDAP_LOGIN_FALLBACK') === true) {
          return fallbackDefaultAccountSystem(self, loginRequest.username, loginRequest.ldapPass)
        }

        throw new Meteor.Error('LDAP-login-error', `LDAP Authentication failed with provided username [${loginRequest.username}]`)
      }

      // Look to see if user already exists

      let userQuery

      const Unique_Identifier_Field = getLdapUserUniqueID(ldapUser)
      let user
      // Attempt to find user by unique identifier

      if (Unique_Identifier_Field) {
        userQuery = {
          'services.ldap.id': Unique_Identifier_Field.value,
        }

        logInfo('Querying user')
        logDebug('userQuery', userQuery)

        user = await Meteor.users.findOneAsync(userQuery)
      }

      // Attempt to find user by username

      let username
      let email

      if (LDAP.getSettings('LDAP_USERNAME_FIELD') !== '') {
        username = getLdapUsername(ldapUser)
      } else {
        username = loginRequest.username
      }

      if (LDAP.getSettings('LDAP_EMAIL_FIELD') !== '') {
        email = getLdapEmail(ldapUser)
      }

      if (!user) {
        if (email && LDAP.getSettings('LDAP_EMAIL_MATCH_REQUIRE') === true) {
          if (LDAP.getSettings('LDAP_EMAIL_MATCH_VERIFIED') === true) {
            userQuery = {
              _id: username,
              'emails.0.address': email,
              'emails.0.verified': true,
            }
          } else {
            userQuery = {
              _id: username,
              'emails.0.address': email,
            }
          }
        } else {
          userQuery = {
            username,
          }
        }

        logDebug('userQuery', userQuery)

        user = await Meteor.users.findOneAsync(userQuery)
      }

      // Attempt to find user by e-mail address only

      if (!user && email && LDAP.getSettings('LDAP_EMAIL_MATCH_ENABLE') === true) {
        logInfo('No user exists with username', username, '- attempting to find by e-mail address instead')

        if (LDAP.getSettings('LDAP_EMAIL_MATCH_VERIFIED') === true) {
          userQuery = {
            'emails.0.address': email,
            'emails.0.verified': true,
          }
        } else {
          userQuery = {
            'emails.0.address': email,
          }
        }

        logDebug('userQuery', userQuery)

        user = await Meteor.users.findOneAsync(userQuery)
      }

      // Login user if they exist
      if (user) {
        if (user.authenticationMethod !== 'ldap' && LDAP.getSettings('LDAP_MERGE_EXISTING_USERS') !== true) {
          logInfo('User exists without "authenticationMethod : ldap"')
          throw new Meteor.Error('LDAP-login-error', 'LDAP Authentication succeded, but there\'s already a matching titra account in MongoDB')
        }

        logInfo('Logging user')

        const stampedToken = Accounts._generateStampedLoginToken()
        const update_data = {
          $push: {
            'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken),
          },
        }

        if (LDAP.getSettings('LDAP_SYNC_ADMIN_STATUS') === true) {
          logDebug('Updating admin status')
          const targetGroups = LDAP.getSettings('LDAP_SYNC_ADMIN_GROUPS').split(',')
          const groups = await ldap.getUserGroups(username, ldapUser)
            .filter((value) => targetGroups.includes(value))

          user.isAdmin = groups?.length > 0
          await Meteor.users.updateAsync({ _id: user._id }, { $set: { isAdmin: user.isAdmin } })
        }

        await Meteor.users.updateAsync(user._id, update_data)

        syncUserData(user, ldapUser)

        if (LDAP.getSettings('LDAP_LOGIN_FALLBACK') === true) {
          await Accounts.setPasswordAsync(user._id, loginRequest.ldapPass, { logout: false })
        }

        return {
          userId: user._id,
          token: stampedToken.token,
        }
      }

      // Create new user

      logInfo('User does not exist, creating', username)

      if (LDAP.getSettings('LDAP_USERNAME_FIELD') === '') {
        username = undefined
      }

      if (LDAP.getSettings('LDAP_LOGIN_FALLBACK') !== true) {
        loginRequest.ldapPass = undefined
      }

      const result = await addLdapUser(ldapUser, username, loginRequest.ldapPass)

      if (LDAP.getSettings('LDAP_SYNC_ADMIN_STATUS') === true) {
        logDebug('Updating admin status')
        const targetGroups = LDAP.getSettings('LDAP_SYNC_ADMIN_GROUPS').split(',')
        const groups = await ldap.getUserGroups(username, ldapUser).filter((value) => targetGroups.includes(value))

        result.isAdmin = groups?.length > 0
        await Meteor.users.updateAsync({ _id: result.userId }, { $set: { isAdmin: result.isAdmin } })
      }
      if (result instanceof Error) {
        throw result
      }
      return result
    })
  }
})
// Object.defineProperty(Object.prototype, 'getLDAPValue', {
//   value(prop) {
//     if (!prop) {
//       return
//     }
//     const self = this
//     for (const key in self) {
//       if (key.toLowerCase() == prop.toLowerCase()) {
//         return self[key]
//       }
//     }
//   },
//   enumerable: false,
// })

const isEmpty = (obj) => [Object, Array]
  .includes((obj || {}).constructor) && !Object.entries((obj || {})).length

function templateVarHandler(variable, object) {
  const templateRegex = /#{([\w\-]+)}/gi
  let match = templateRegex.exec(variable)
  let tmpVariable = variable

  if (match == null) {
    if (!object.hasOwnProperty(variable)) {
      return
    }
    return object[variable]
  }
  while (match != null) {
    const tmplVar = match[0]
    const tmplAttrName = match[1]

    if (!object.hasOwnProperty(tmplAttrName)) {
      return
    }

    const attrVal = object[tmplAttrName]
    tmpVariable = tmpVariable.replace(tmplVar, attrVal)
    match = templateRegex.exec(variable)
  }
  return tmpVariable
}

function getPropertyValue(obj, key) {
  try {
    return key.split('.').reduce((acc, el) => acc[el], obj)
  } catch (err) {
    return undefined
  }
}

function getDataToSyncUserData(ldapUser, user) {
  const syncUserData = LDAP.getSettings('LDAP_SYNC_USER_DATA')
  const syncUserDataFieldMap = LDAP.getSettings('LDAP_SYNC_USER_DATA_FIELDMAP')?.trim()

  const userData = {}

  if (syncUserData && syncUserDataFieldMap) {
    const whitelistedUserFields = ['email', 'name', 'customFields']
    const fieldMap = JSON.parse(syncUserDataFieldMap)
    const emailList = []
    fieldMap.map((userField, ldapField) => {
      logDebug(`Mapping field ${ldapField} -> ${userField}`)
      switch (userField) {
        case 'email':
          if (!ldapUser.hasOwnProperty(ldapField)) {
            logDebug(`user does not have attribute: ${ldapField}`)
            return
          }

          if (ldapUser[ldapField] === Object(ldapUser[ldapField])) {
            ldapUser[ldapField].map((item) => {
              emailList.push({ address: item, verified: true })
            })
          } else {
            emailList.push({ address: ldapUser[ldapField], verified: true })
          }
          break

        default:
          const [outerKey, innerKeys] = userField.split(/\.(.+)/)

          if (!whitelistedUserFields.find((el) => el === outerKey)) {
            logDebug(`user attribute not whitelisted: ${userField}`)
            return
          }

          if (outerKey === 'customFields') {
            let customFieldsMeta

            try {
              customFieldsMeta = JSON.parse(LDAP.getSettings('Accounts_CustomFields'))
            } catch (e) {
              logDebug('Invalid JSON for Custom Fields')
              return
            }

            if (!getPropertyValue(customFieldsMeta, innerKeys)) {
              logDebug(`user attribute does not exist: ${userField}`)
              return
            }
          }
          const tmpUserField = getPropertyValue(user, userField)
          const tmpLdapField = templateVarHandler(ldapField, ldapUser)

          if (tmpLdapField && tmpUserField !== tmpLdapField) {
          // creates the object structure instead of just assigning 'tmpLdapField' to
          // 'userData[userField]' in order to avoid the "cannot use the part (...)
          // to traverse the element" (MongoDB) error that can happen. Do not handle
          // arrays.
          // TODO: Find a better solution.
            const dKeys = userField.split('.')
            const lastKey = dKeys[dKeys.length - 1]
            dKeys.reduce((obj, currKey) => ((currKey === lastKey)
              ? obj[currKey] = tmpLdapField
              : obj[currKey] = obj[currKey] || {}),
            userData)
            logDebug(`user.${userField} changed to: ${tmpLdapField}`)
          }
      }
    })

    if (emailList?.length > 0) {
      if (JSON.stringify(user.emails) !== JSON.stringify(emailList)) {
        userData.emails = emailList
      }
    }
  }

  const uniqueId = getLdapUserUniqueID(ldapUser)

  if (uniqueId
    && (!user.services
      || !user.services.ldap
      || user.services.ldap.id !== uniqueId.value
      || user.services.ldap.idAttribute !== uniqueId.attribute)) {
    userData['services.ldap.id'] = uniqueId.value
    userData['services.ldap.idAttribute'] = uniqueId.attribute
  }

  if (user.authenticationMethod !== 'ldap') {
    userData.ldap = true
  }

  if (Object.keys(userData).length) {
    return userData
  }
}

async function syncUserData(user, ldapUser) {
  logInfo('Syncing user data')
  logDebug('user', { email: user.email, _id: user._id })
  // logDebug('ldapUser', ldapUser.object);

  if (LDAP.getSettings('LDAP_USERNAME_FIELD') !== '') {
    const username = getLdapUsername(ldapUser)
    if (user && user._id && username !== user.username) {
      logInfo('Syncing user username', user.username, '->', username)
      await Meteor.users.findOneAsync({ _id: user._id }, { $set: { username } })
    }
  }

  if (LDAP.getSettings('LDAP_FULLNAME_FIELD') !== '') {
    const fullname = getLdapFullname(ldapUser)
    logDebug('fullname=', fullname)
    if (user && user._id && fullname !== '') {
      logInfo('Syncing user fullname:', fullname)
      await Meteor.users.updateAsync({ _id: user._id }, { $set: { 'profile.fullname': fullname } })
    }
  }

  if (LDAP.getSettings('LDAP_EMAIL_FIELD') !== '') {
    const email = getLdapEmail(ldapUser)
    logDebug('email=', email)

    if (user && user._id && email !== '') {
      logInfo('Syncing user email:', email)
      await Meteor.users.updateAsync({
        _id: user._id,
      }, {
        $set: {
          'emails.0.address': email,
        },
      })
    }
  }
}

async function addLdapUser(ldapUser, username, password) {
  const uniqueId = getLdapUserUniqueID(ldapUser)

  const userObject = {
  }

  if (username) {
    userObject.username = username
  }

  const userData = getDataToSyncUserData(ldapUser, {})

  if (userData && userData.emails && userData.emails[0] && userData.emails[0].address) {
    if (Array.isArray(userData.emails[0].address)) {
      userObject.email = userData.emails[0].address[0]
    } else {
      userObject.email = userData.emails[0].address
    }
  } else if (ldapUser.mail && ldapUser.mail.indexOf('@') > -1) {
    userObject.email = ldapUser.mail
  } else if (LDAP.getSettings('LDAP_DEFAULT_DOMAIN') !== '') {
    userObject.email = `${username || uniqueId.value}@${LDAP.getSettings('LDAP_DEFAULT_DOMAIN')}`
  } else {
    const error = new Meteor.Error('LDAP-login-error', 'LDAP Authentication succeded, there is no email to create an account. Have you tried setting your Default Domain in LDAP Settings?')
    logError(error)
    throw error
  }
  // handle special case for titra to sync profile.name
  // and initial project description as this is a mandatory field for us
  if (getLdapFullname(ldapUser)) {
    userObject.profile = {}
    userObject.profile.name = getLdapFullname(ldapUser)
    userObject.profile.currentLanguageProject = 'Project'
    userObject.profile.currentLanguageProjectDesc = { ops: [{ insert: 'This project has been automatically created for you, feel free to change it! Did you know that you can use emojis like 💰 ⏱ 👍 everywhere?' }] }
  }
  logDebug('New user data', userObject)

  if (password) {
    userObject.password = password
  }

  try {
    // This creates the account with password service
    userObject.ldap = true
    userObject._id = Accounts.createUser(userObject)

    // Add the services.ldap identifiers
    await Meteor.users.updateAsync({ _id: userObject._id }, {
      $set: {
        'services.ldap': { id: uniqueId.value },
        'emails.0.verified': true,
        authenticationMethod: 'ldap',
      },
    })
  } catch (error) {
    logError('Error creating user', error)
    return error
  }

  await syncUserData(userObject, ldapUser)

  return {
    userId: userObject._id,
  }
}