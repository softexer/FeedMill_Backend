var express = require('express');
var router = express.Router();
var ReceviedStock = require('../Controllers/stock/addstock');
var fetchReceivedStock = require('../Controllers/stock/fetchstock');
var adminstcokpoints = require('../Controllers/stock/addrawmaterial')

var fileupload = require('express-fileupload');
router.use(fileupload({ limits: { fileSize: 50 * 1024 * 1024 } }));
router.post("/addstock", (req, res) => {
    ReceviedStock.addPurchasedStock(req, res)
})
router.post("/fetchstock", (req, res) => {
    fetchReceivedStock.fetchreceivedstocksdata(req, res)
})
router.post("/addadminstockpoints", (req, res) => {
    adminstcokpoints.addrawmateriallist(req, res)
})
router.get("/fetchadminstockpoints", (req, res) => {
    adminstcokpoints.fetchadminstockpoints(req, res)
})
router.put("/updatestockpoints", (req, res) => {
    adminstcokpoints.updateStockPoints(req, res)
})
router.delete("/deletestockpoints", (req, res) => {
    adminstcokpoints.deleteStockPoints(req, res)
})
module.exports = router;