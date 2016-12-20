var Etcd = require("node-etcd");
var util = require("util");
var current = 0;
/**
 * This is a constructor for a HttpProxyRules instance.
 * @param {Object} options Takes in a `targets` obj
 */
function HttpProxySticker(options) {
  this.targets = options.targets;
  this.etcd = new Etcd("http://127.0.0.1:2379")

  return this;
};

/**
 * This function will modify the `req` object if a match is found.
 * We also return the new endpoint string if a match is found.
 * @param  {Object} options Takes in a `req` object.
 */
HttpProxySticker.prototype.select = function select(req) {
  var targets = this.targets;
  var target = selectTarget(targets);
  var etcd = this.etcd;
  var path = new Buffer(req.url).toString("base64");
  var referrer = req.headers.referer || null;

  if (referrer) {
    util.log("referrer used")
    path = new Buffer(referrer).toString("base64");
  }

  var result = etcd.getSync(path)
  if (result.err && result.err.errorCode === 100) {
    etcd.setSync(path, target, {ttl: 30})
    util.log ("1: " + target + " path: "  + path)
  } else if (result.err === null) {
    target = result.body.node.value;
    util.log ("2: " + target + " path: " + path)
  } else {
    util.log(result)
  }
  return target;
}

function selectTarget(targets) {
  if (current >= targets.length - 1) 
    current = 0; 
  else
    current++;

  util.log("Current: "+ current);
  return targets[current];
}

module.exports = HttpProxySticker;
