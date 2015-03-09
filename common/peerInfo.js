
//
// Standardised 'PeerInfo' object containing everything we want to know
//

var PeerInfo = function(id, username, initiator) {
    this.id = id;
    this.username = username;
    this.initiator = initiator || false;
};


// Export

module.exports = PeerInfo;

