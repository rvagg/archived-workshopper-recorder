const fs     = require('fs')
    , path   = require('path')
    , mkdirp = require('mkdirp')
    , after  = require('after')


function setup (callback) {
  // record the submission arg before any other processors get
  // their hands on it and change it
  this._recorderSubmission = this.args[0]
  process.nextTick(callback)
}


function cleanup (pass, callback) {
  var exerciseDataDir    = this.exerciseDataDir =
        path.join(this.workshopper.dataDir, 'submissions', this.id)
    , metadataFile       = path.join(exerciseDataDir, 'meta.json')
    , recorderSubmission = this._recorderSubmission

  // set up the recorder directory for this exercise
  mkdirp(this.exerciseDataDir, function (err) {
    if (err)
      return callback(err)

    var data
      , solution
      , done = after(2, callback)
      , outfile

    // metadata file
    try {
      data = JSON.parse(fs.readFileSync(metadataFile, 'utf8'))
    } catch (e) {}

    if (typeof data != 'object')
      data = {}

    if (!data.solutions)
      data.solutions = []

    // new solution, zero-padded index
    solution = String(data.solutions.length)
    while (solution.length < 3)
      solution = '0' + solution

    // full path to storage file for this submission
    outfile = path.join(
        exerciseDataDir
      , solution + path.extname(recorderSubmission)
    )

    // record metadata on this submission
    data.solutions.push({
        id   : solution
      , time : new Date()
      , pass : pass
      , src  : path.basename(recorderSubmission)
      , dst  : path.basename(outfile)
    })

    // copy submission file
    fs.createReadStream(recorderSubmission)
      .pipe(fs.createWriteStream(outfile))
      .on('error', done)
      .on('finish', done)

    // write metadata file
    fs.writeFile(metadataFile, JSON.stringify(data, null, 2), 'utf8', done)
  })
}


function fix (exercise) {
  exercise._recorder = true

  exercise.addVerifySetup(setup)
  exercise.addVerifyCleanup(cleanup)
}


function recorder (exercise) {
  if (!exercise._recorder)
    fix(exercise)
  return exercise
}


module.exports = recorder
