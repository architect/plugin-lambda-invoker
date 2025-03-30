module.exports = {
  // Necessary per Enquirer #326
  start: function start () {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
      process.stdin.setEncoding('utf8')
      process.stdin.resume()
    }
  },
  // Super important to pause stdin, or Sandbox will hang forever in tests
  end: function end () {
    if (process.stdin.isTTY) {
      process.stdin.pause()
    }
  },
  defaultPragmas: [ 'customLambdas', 'events', 'queues', 'scheduled', 'tables-streams' ],
}
