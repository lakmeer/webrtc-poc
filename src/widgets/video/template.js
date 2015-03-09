/**
 * Created by ghoststreet on 2/24/15.
 */

export default function videoTemplate (name) {
    var doc = document.createElement("div");
    doc.innerHTML = '<div class="video"><p class="name">' + name + '</p><video></video></div>';
    return doc;
};

