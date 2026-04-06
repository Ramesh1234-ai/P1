import { login } from "../controller/user.controller";
import { register } from "../controller/user.controller";
import { VerifyJwt } from "../middleware/auth.middleware";
import express from express
const router =express.Router();
router.post("/login",VerifyJwt,login)
router.post("/register",VerifyJwt,register)
export default router;