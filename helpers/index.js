/**
 * Created by ghoststreet on 2/24/15.
 */
// Helpers

function log () {
    console.log.apply(console, arguments);
}

function reportError (error) {
    console.error('Error:', error);
}

function id () {
    return arguments[0];
}

module.exports = {
    log: log,
    reportError: reportError,
    id: id
};