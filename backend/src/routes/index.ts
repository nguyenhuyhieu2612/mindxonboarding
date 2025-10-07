import express from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.router";
import telemetryDemoRoutes from "./telemetry-demo.routes";

const router = express.Router();

const routers = [
  { prefix: "/auth", route: authRoutes },
  { prefix: "/users", route: userRoutes },
  { prefix: "/demo", route: telemetryDemoRoutes },
];

routers.forEach(({ prefix, route }) => {
  router.use(prefix, route);
});

export default router;
