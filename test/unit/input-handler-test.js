let test = require('tape')
let { defaultPragmas } = require('../../src/utils')
let pragmas = defaultPragmas.slice(0)
let proxyquire = require('proxyquire')

// Set up mocks for dependencies
function createFSMock () {
  return {
    readFileSync: () => (JSON.stringify({})),
    existsSync: () => true,
  }
}
function createInvMock () {
  return { inv: { _project: { cwd: process.cwd(), preferences: {} } } }
}
function createLogMock () {
  return { status: () => ({}) }
}
function createEnquirerMock () {
  return { prompt: async () => ({}) }
}
let invoke = async () => ({})
function createMocks () {
  return {
    fsMock: createFSMock(),
    invoke,
    invMock: createInvMock(),
    logger: createLogMock(),
    enquirer: createEnquirerMock(),
  }
}

function mockHandlerFactory (mox) {
  delete process.env.ARC_ENV
  return proxyquire('../../src/input-handler', {
    fs: mox.fsMock,
    enquirer: mox.enquirer,
    './utils': { start: () => ({}) },
  })
}

test('Should do nothing if handler not invoked with `i`', async t => {
  let mocks = createMocks()
  const intercept = t.capture(mocks, 'invoke')
  let handler = mockHandlerFactory(mocks)(mocks.logger, pragmas, mocks.invMock.inv, mocks.invoke)
  await handler('x')
  const invoked = intercept()
  t.equal(invoked.length, 0, 'lambda invoke not called')
})

test('Should return if no lambdas to invoke', async t => {
  let mocks = createMocks()
  const intercept = t.capture(mocks, 'invoke')
  const logcept = t.capture(mocks.logger, 'status')
  let handler = mockHandlerFactory(mocks)(mocks.logger, pragmas, mocks.invMock.inv, mocks.invoke)
  await handler('i')
  const invoked = intercept()
  const logged = logcept()
  t.equal(invoked.length, 0, 'lambda invoke not called')
  t.match(logged[0].args[0], /no lambdas found/i, 'logged that no lambdas found')
})

test('Should prompt for lambda selection and allow for cancellation', async t => {
  let mocks = createMocks()
  const intercept = t.capture(mocks, 'invoke')
  t.capture(mocks.enquirer, 'prompt', async () => ({ lambda: 'cancel' }))
  mocks.invMock.inv['events'] = [ { name: 'test-event' } ]
  let handler = mockHandlerFactory(mocks)(mocks.logger, pragmas, mocks.invMock.inv, mocks.invoke)
  await handler('i')
  const invoked = intercept()
  t.equal(invoked.length, 0, 'lambda invoke not called')
})

test('Should prompt for lambda selection and invoke matching lambda', async t => {
  let mocks = createMocks()
  const intercept = t.capture(mocks, 'invoke')
  t.capture(mocks.enquirer, 'prompt', async () => ({ lambda: '@events test-event' }))
  mocks.invMock.inv['events'] = [ { name: 'test-event' } ]
  let handler = mockHandlerFactory(mocks)(mocks.logger, pragmas, mocks.invMock.inv, mocks.invoke)
  await handler('i')
  const invoked = intercept()
  t.equal(invoked.length, 1, 'lambda invoke called')
})
