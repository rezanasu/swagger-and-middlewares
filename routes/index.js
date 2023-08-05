const express = require("express");
const router = express.Router();
const authRouter = require("./auth.js")
const productRouter = require("./product.js")
const {authentication} = require("../middlewares/auth.js");


router.use("/auth", authRouter);

router.use(authentication)
// KENA AUTHENTICATION
router.use("/products", productRouter);


module.exports = router;