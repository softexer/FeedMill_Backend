var express = require('express');
var router = express.Router();
var ReceviedStock = require('../Controllers/stock/addstock');

var fileupload = require('express-fileupload');
router.use(fileupload({ limits: { fileSize: 50 * 1024 * 1024 } }));
router.post("/addstock", (req, res) => {
    ReceviedStock.addPurchasedStock(req, res)
})
module.exports = router;