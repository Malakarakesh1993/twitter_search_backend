var jwt = require('jsonwebtoken');
var config = require('./config');
function verifyToken(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['authorization'];
  if (!token)
    return res.status(403).send({ auth: false, message: 'No token provided.' });
  jwt.verify(token, config.secret_key, function(err, decoded) {
    if (err)
    return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    // if everything good, save to request for use in other routes
    req.userId = decoded.user_id;
    next();
  });
}
module.exports = verifyToken;