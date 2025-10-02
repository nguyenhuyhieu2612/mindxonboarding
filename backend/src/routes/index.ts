import express from 'express';
import authRoutes from './auth.routes';
import helloRoutes from './hello.routes';

const router = express.Router();

const routers = [
    { prefix: '/auth', route: authRoutes },
    { prefix: '/hello', route: helloRoutes }
]

routers.forEach(({ prefix, route }) => {
    router.use(prefix, route);
});

export default router;


