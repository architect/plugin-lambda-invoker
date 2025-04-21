let { join } = require('path')
let { existsSync, readFileSync } = require('fs')
let { prompt } = require('enquirer')
let colors = require('ansi-colors')
let { marshall } = require('@aws-sdk/util-dynamodb')
let mock = require('./event-mocks')
let { start } = require('./utils')

let lastInvoke

module.exports = function bindInputHandler (update, pragmas, inv, invoke) {
  let cwd = inv._project.cwd
  let jsonMocks = join(cwd, 'sandbox-invoke-mocks.json')
  let jsMocks = join(cwd, 'sandbox-invoke-mocks.js')
  let cjsMocks = join(cwd, 'sandbox-invoke-mocks.cjs')
  let mjsMocks = join(cwd, 'sandbox-invoke-mocks.mjs')
  return async function eventInvokeListener (input) {
    // Build out the available event list each time to prevent caching
    let events = {}
    pragmas.forEach(pragma => {
      if (inv[pragma]) inv[pragma].forEach(({ name }) => {
        events[`@${pragma} ${name}`] = { pragma, name }
      })
    })
    // Add a cancel option should one desire
    events.cancel = ''

    let lastEventName
    if (lastInvoke) {
      lastEventName = `Last invoke: @${lastInvoke.pragma} ${lastInvoke.name} (${lastInvoke.mockName})`
      events[lastEventName] = lastInvoke
    }

    start()
    input = String(input)
    // Reset Enquirer's styles
    let options = {
      prefix: colors.white(colors.symbols?.question ?? '?'),
      styles: {
        em: colors.cyan, // Clear underlines
        danger: colors.red,
        strong: colors.white,
      },
    }
    if (input === 'i') {
      if (Object.keys(events).length === 1) {
        let none = 'No Lambdas found to invoke'
        if (pragmas.length) update.status(none, `Using the following pragmas: @${pragmas.join(', @')}`)
        else update.status(none)
        return
      }

      let userPayload = {}
      let mockName = 'empty'
      let pragma, name, mocks, skipSelection

      // Load invocation mocks
      if (existsSync(jsonMocks)) {
        mocks = JSON.parse(readFileSync(jsonMocks))
      }
      else if (existsSync(jsMocks)) {
        mocks = await getMod(jsMocks)
      }
      else if (existsSync(cjsMocks)) {
        mocks = require(cjsMocks)
      }
      else if (existsSync(mjsMocks)) {
        mocks = await getMod(mjsMocks)
      }

      try {
        let { lambda } = await prompt({
          type: 'select',
          name: 'lambda',
          numbered: true,
          message: 'Which event do you want to invoke?',
          hint: '\nYou can use numbers to change your selection',
          choices: Object.keys(events),
        }, options)
        if (lambda === 'cancel') return start()
        else if (lambda === lastEventName) {
          skipSelection = true
          var event = events[lastEventName]
          mockName = event.mockName
        }
        else {
          var event = events[lambda]
        }
        pragma = event.pragma
        name = event.name

        // Set up non-cached user payload from last event
        if (lambda === lastEventName) {
          userPayload = mocks[pragma][name][mockName] || {}
        }
      }
      catch {
        update.status('Canceled invoke')
        return start()
      }

      // Present options for mocks (if any)
      let mockable = ![ 'scheduled', 'tables-streams' ].includes(pragma)
      if (mocks?.[pragma]?.[name] && mockable && !skipSelection) {
        let selection = await prompt({
          type: 'select',
          name: 'mock',
          numbered: true,
          message: 'Which mock do you want to invoke?',
          choices: [ ...Object.keys(mocks[pragma][name]), 'empty' ],
        }, options)
        mockName = selection.mock
        userPayload = mocks[pragma][name][mockName] || {}
      }
      lastInvoke = { pragma, name, mockName, userPayload }

      let payload
      if (pragma === 'events') payload = mock.events(userPayload)
      else if (pragma === 'queues') payload = mock.queues(userPayload)
      else if (pragma === 'scheduled') payload = mock.scheduled()
      else if (pragma === 'customLambdas') payload = mock.customLambdas(userPayload)
      else if (pragma === 'tables-streams') {
        let { eventName } = await prompt({
          type: 'select',
          name: 'eventName',
          message: 'Which kind of Dynamo Stream event do you want to invoke?',
          choices: [ 'INSERT', 'MODIFY', 'REMOVE' ],
        })
        payload = mock.tablesStreams(eventName, marshallJson(mocks?.[pragma]?.[name]?.[eventName]))
      }
      else {
        if (!Object.keys(userPayload).length) {
          update.warning('Warning: real AWS event sources generally do not emit empty payloads')
        }
        payload = userPayload
      }

      // Wrap it up and invoke!
      let msg = `Invoking @${pragma} ${name}`
      msg += ` with ${mockName === 'empty' ? 'empty' : `'${mockName}'`} payload`
      update.status(msg)
      try {
        await invoke({ pragma, name, payload })
      }
      catch (e) {
        update.warn(e)
      }
      start()
    }
  }
}

async function getMod (filepath) {
  let mod

  // Best effort to ensure changes to mocks are always reflected
  delete require.cache[require.resolve(filepath)]

  try {
    mod = require(filepath)
    if (process?.features?.require_module === true && mod.default) {
      mod = mod.default
    }
  }
  catch (err) {
    if (hasEsmError(err)) {
      let path = process.platform.startsWith('win')
        ? 'file://' + filepath
        : filepath
      let imported = await import(path)
      mod = imported.default ? imported.default : imported
    }
    else {
      throw err
    }
  }

  return mod
}

let esmErrors = [
  'Cannot use import statement outside a module',
  `Unexpected token 'export'`,
  'require() of ES Module',
  'Must use import to load ES Module',
]
let hasEsmError = err => esmErrors.some(msg => err.message.includes(msg))
// Marshalls Json from the mock into keys and newimage for tables-streams
function marshallJson (json) {
  const marshalled = marshall(json)
  const Keys = Object.keys(marshalled).reduce((keys, key) => {
    keys[key] = { [Object.keys(marshalled[key])[0]]: true }
    return keys
  }, {})
  return { Keys, NewImage: marshalled }
}
