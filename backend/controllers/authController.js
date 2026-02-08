import { OAuth2Client } from 'google-auth-library';
import prisma from '../db.js'; 
import jwt from 'jsonwebtoken';

// --- PEGA AQUÍ TU ID DE CLIENTE ---
const GOOGLE_CLIENT_ID = "1010872716702-mgis6t157vvfo2rleicil4ted94h6d1i.apps.googleusercontent.com"; 
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
    const { token } = req.body; 

    try {
        // 1. Verificar el token con Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const { name, email, picture } = ticket.getPayload();

        // 2. Buscar o Crear usuario
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Crear usuario nuevo si no existe
            const randomPassword = Math.random().toString(36).slice(-8); 
            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: randomPassword, 
                }
            });
        }

        // 3. Generar sesión (Token propio)
        // IMPORTANTE: Asegúrate de usar tu "PALABRA_SECRETA" real aquí
        const sessionToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET, // <--- AQUÍ ESTÁ EL CAMBIO (Sin comillas)
            { expiresIn: '1d' }
        );

        res.json({
            token: sessionToken,
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error("Error Google Auth:", error);
        res.status(401).json({ error: "Token inválido" });
    }
};