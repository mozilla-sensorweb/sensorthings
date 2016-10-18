import express from 'express';
import base    from './routes/base';

let router = express.Router();

router.get('/', base);

module.exports = router;
