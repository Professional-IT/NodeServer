const router = require('express').Router();

const myController = require('../controllers/mycontrollers');

router.post('/login', myController.login);




module.exports = router;
