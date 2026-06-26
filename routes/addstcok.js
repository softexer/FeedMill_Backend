var express = require('express');
var router = express.Router();
var ReceviedStock = require('../Controllers/stock/addstock');
var fetchReceivedStock = require('../Controllers/stock/fetchstock');

var fileupload = require('express-fileupload');
router.use(fileupload({ limits: { fileSize: 50 * 1024 * 1024 } }));
router.post("/addstock", (req, res) => {
    ReceviedStock.addPurchasedStock(req, res)
})
router.post("/fetchstock", (req, res) => {
    fetchReceivedStock.fetchreceivedstocksdata(req, res)
})
module.exports = router;