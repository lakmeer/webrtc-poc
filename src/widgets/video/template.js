/**
 * Created by ghoststreet on 2/24/15.
 */
module.exports = function(name) {
    var doc = document.createElement("div");
    doc.innerHTML = "<div><p>" + name + "</p><video></video></div>";
    return doc;
};