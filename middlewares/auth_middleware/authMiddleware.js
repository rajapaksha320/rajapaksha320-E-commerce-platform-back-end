const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    console.log(req.headers.authorization);
    
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.body.userId = decoded.userId;
    req.body.tenantId = decoded.tenantId;
    req.body.role = decoded.role;
    console.log('Decoded JWT:', decoded);

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;