import { Router, Request, Response } from "express";

const router = Router();

// POST /auth/login
router.post("/login", (req: Request, res: Response) => {});

// POST /auth/register
router.post("/register", (req, res) => {});

export default router;
