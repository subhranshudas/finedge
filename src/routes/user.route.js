const { Router } = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/user.validator');

const router = Router();

router.post('/', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);

module.exports = router;
