
//
// Standardised 'PeerInfo' object containing everything we want to know
//

var PeerInfo = function(id, username) {
    this.id = id;
    this.username = username;
    this.meta = {};
};


// Export

module.exports = PeerInfo;

