
// Simple robust Collection class
//
// Is like an array but has all kinds of useful extra features

var Collection = function () {
  this.members = [];
  this.length = 0;
};

Collection.prototype.push = function (item) {
  this.members.push(item);
  this.length = this.members.length;
  return this.members;
};

Collection.prototype.forEach = function (λ) {
  return this.members.forEach(λ);
};

Collection.prototype.select = function (λ) {
  var result = this.members.filter(λ);
  return result.length > 0 ? result[0] : undefined;
};

Collection.prototype.anyWith = function (prop, value) {
  return this.select(function (item) {
    return item[prop] && item[prop] === value;
  });
};

Collection.prototype.remove = function (peerInfo) {
  this.members.splice( this.members.indexOf(peerInfo), 1 );
};


// Export

module.exports = Collection;

