import { Match, check } from 'meteor/check'
import { getJson } from './bodyparser'
import { insertTimeCard } from '../imports/api/timecards/methods'
import Timecards from '../imports/api/timecards/timecards'
import Projects from '../imports/api/projects/projects'

function sendResponse(res, statusCode, message, payload) {
  const response = {}
  response.statusCode = statusCode
  response.message = message
  if (payload) {
    response.payload = payload
  }
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  })
  res.end(JSON.stringify(response))
}
function checkAuthorization(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader) {
    const meteorUser = Meteor.users.findOne({ 'profile.APItoken': authHeader.split(' ')[1] })
    if (authHeader && authHeader.split(' ')[1] && meteorUser) {
      return meteorUser
    }
  }
  sendResponse(res, 401, 'Missing authorization header or invalid authorization token supplied.')
  return false
}
/**
 * @apiDefine AuthError
 * @apiError {json} AuthError The request is missing the authentication header or an invalid API token has been provided.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "message": "Missing authorization header or invalid authorization token supplied."
 *     }
 */

/**
 * @api {post} /timeentry/create Create time entry
 * @apiName createTimeEntry
 * @apiDescription Create a new time entry for the user assigned to the provided API token
 * @apiGroup TimeEntry
 *
 * @apiHeader {String} Token The authorization header Bearer API token.
 * @apiParam {String} projectId The project ID.
 * @apiParam {String} task The task description of the new time entry.
 * @apiParam {Date} date The date for the new time entry in format YYYY-MM-DD.
 * @apiParam {Number} hours The number of hours to track.
 * @apiParamExample {json} Request-Example:
 *                  {
 *                    "projectId": "123456",
 *                    "task": "Work done.",
 *                    "date": "2019-11-10",
 *                    "hours": 8
 *                  }
 * @apiSuccess {json} The id of the new time entry.
 * @apiSuccessExample {json} Success response:
 * {
 *  message: "time entry created."
 *  payload: {
 *    timecardId: "123456"
 *  }
 *  }
 * @apiUse AuthError
 */
WebApp.connectHandlers.use('/timeentry/create/', async (req, res, next) => {
  const meteorUser = checkAuthorization(req, res)
  if (!meteorUser) {
    return
  }
  const json = await getJson(req).catch((e) => {
    sendResponse(res, 400, `Invalid JSON received. ${e}`)
  })
  if (json) {
    try {
      check(json.projectId, String)
      check(json.task, String)
      check(new Date(json.date), Date)
      check(json.hours, Number)
    } catch (error) {
      sendResponse(res, 500, `Invalid parameters received.${error}`)
      return
    }
    const timecardId = insertTimeCard(json.projectId, json.task, new Date(json.date), json.hours, meteorUser._id)
    const payload = {}
    payload.timecardId = timecardId
    sendResponse(res, 200, 'time entry created.', payload)
    return
  }
  sendResponse(res, 500, 'Missing mandatory parameters.')
})

/**
  * @api {get} /timeentry/list/:date Get time entries for date
  * @apiDescription Create a new time entry for the user assigned to the provided API token
  * @apiName getTimeEntriesForDate
  * @apiGroup TimeEntry
  *
  * @apiHeader {String} Token The authorization header Bearer API token.
  * @apiParam {Date} date The date to list time entries for in format YYYY-MM-DD.

  * @apiSuccess {json} response An array of time entries tracked for the user with the provided API token
  * for the provided date.
  * @apiUse AuthError
  */
WebApp.connectHandlers.use('/timeentry/list/', async (req, res, next) => {
  const meteorUser = checkAuthorization(req, res)
  if (!meteorUser) {
    return
  }
  const url = req._parsedUrl.pathname.split('/')
  const date = new Date(url[3])
  try {
    check(date, Date)
  } catch (error) {
    sendResponse(res, 500, `Invalid parameters received.${error}`)
    return
  }
  const payload = Timecards.find({
    userId: meteorUser._id,
    date,
  }).fetch()
  sendResponse(res, 200, `Returning user time entries for date ${date}`, payload)
})

/**
   * @api {get} /project/list/ Get all projects
   * @apiDescription Lists all projects visible to the user assigned to the provided API token
   * @apiName getProjects
   * @apiGroup Project
   *
   * @apiHeader {String} Token The authorization header Bearer API token.
   * @apiSuccess {json} response An array of all projects visible for the user with the provided API token.
   * @apiUse AuthError
   */
WebApp.connectHandlers.use('/project/list/', async (req, res, next) => {
  const meteorUser = checkAuthorization(req, res)
  if (!meteorUser) {
    return
  }
  const payload = Projects.find({
    $or: [{ userId: meteorUser._id }, { public: true }, { team: meteorUser._id }],
  }).fetch()
  sendResponse(res, 200, 'Returning projects', payload)
})

/**
   * @api {post} /project/create/ Create a new project
   * @apiDescription Creates a new titra project based on the parameters provided
   * @apiName CreateProject
   * @apiGroup Project
   *
   * @apiHeader {String} Token The authorization header Bearer API token.
   * @apiParam {String} name The project name.
   * @apiParam {String} [description] The description of the project.
   * @apiParam {String} [color] The project color in HEX color code.
   * @apiParam {String} [customer] The customer of the project.
   * @apiParam {Number} [rate] The hourly rate of the project.
   * @apiParam {Number} [budget] The budget for this project in hours.

   * @apiParamExample {json} Request-Example:
   *                  {
   *                    "name": "Project A",
   *                    "description": "This is the description of Project A.",
   *                    "color": "#009688",
   *                    "customer": "Paying customer",
   *                    "rate": 100,
   *                    "budget": 50
   *                  }
   * @apiSuccess {json} The id of the new project.
   *  * @apiSuccessExample {json} Success response:
    * {
    *  message: "time entry created."
    *  payload: {
    *    projectId: "123456"
    *  }
    *  }
   * @apiUse AuthError
   */
WebApp.connectHandlers.use('/project/create/', async (req, res, next) => {
  const meteorUser = checkAuthorization(req, res)
  if (!meteorUser) {
    return
  }
  const json = await getJson(req).catch((e) => {
    sendResponse(res, 400, `Invalid JSON received. ${e}`)
  })
  if (json) {
    try {
      check(json.name, String)
      check(json.description, Match.Maybe(String))
      check(json.color, Match.Maybe(String))
      check(json.customer, Match.Maybe(String))
      check(json.rate, Match.Maybe(Number))
      check(json.budget, Match.Maybe(Number))
    } catch (error) {
      sendResponse(res, 500, `Invalid parameters received.${error}`)
      return
    }
    json.userId = meteorUser._id
    const projectId = Projects.insert(json)
    const payload = {}
    payload.projectId = projectId
    sendResponse(res, 200, 'Project created.', payload)
  }
})
