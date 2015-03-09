/**
 * Created by ghoststreet on 2/24/15.
 */
// Helpers

exports.log = function () {
    console.log.apply(console, arguments);
}

exports.reportError = function (error) {
    console.error('Error:', error);
}

exports.id = function () {
    return arguments[0];
}

