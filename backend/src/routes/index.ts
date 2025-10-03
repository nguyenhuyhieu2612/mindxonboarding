import express from "express";
import authRoutes from "./auth.routes";

const router = express.Router();

const routers = [{ prefix: "/auth", route: authRoutes }];

routers.forEach(({ prefix, route }) => {
  router.use(prefix, route);
});

export default router;
