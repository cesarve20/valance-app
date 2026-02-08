import jwt from 'jsonwebtoken';

// NOTA: Aquí agregamos 'export' al principio de la función
export const checkAuth = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            console.error("Token inválido");
            return res.status(401).json({ error: 'Token no válido' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'No hay token, autorización denegada' });
    }
};

// YA NO USAMOS 'export default checkAuth;' AL FINAL