// Middleware JWT: protege rutas y valida roles (seguridad, admin)

const jwt = require('jsonwebtoken');
const config = require('../config');

// Exige header Authorization: Bearer <token>
function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    // Decodifica el token y guarda el usuario en req.user
    req.user = jwt.verify(header.slice(7), config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Factory: solo permite los roles indicados (ej. 'admin', 'seguridad')
function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
}

module.exports = { authRequired, requireRol };
