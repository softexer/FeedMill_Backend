var idb = require('../core/generateID');
var rawmateriallist = require('../../app/Models/rawMateriallist')

const addrawmateriallist = async (req, res) => {
    try {
        const {
            rawmaterialID,
            stockPoints = [],
            rawmaterials = [],
            feedBags = []

        } = req.body;
        var params = req.body;
        if (!Array.isArray(stockPoints) || !Array.isArray(rawmaterials) || !Array.isArray(feedBags)) {
            return res.status(400).json({
                success: false,
                message: "stockPoints, rawmaterials and feedBags must be arrays"
            });
        }

        console.log("sttock", stockPoints);
        var stockarray = [];
        var rawmaterialarray = [];
        var feedbagarray = [];
        for (var i = 0; i < stockPoints.length; i++) {
            const point = stockPoints[i];
            const stockPointName = typeof point === "string"
                ? point
                : point.stockPointName || point.stockpointname || point.name;

            stockarray.push({
                stockPointID: "stock@" + idb.GenerateIDS(5),
                stockPointName
            });
        }
        console.log(stockarray);
        for (var i = 0; i < rawmaterials.length; i++) {
            const point = rawmaterials[i];
            const rawMaterialName = typeof point === "string"
                ? point
                : point.rawMaterialName || point.rawmaterialname || point.name;
            rawmaterialarray.push({
                rawMaterialID: "raw@" + idb.GenerateIDS(5),
                rawMaterialName: rawMaterialName
            });
        }
        for (var i = 0; i < feedBags.length; i++) {
            const point = feedBags[i];
            const feedBagName = typeof point === "string"
                ? point
                : point.feedBagName || point.feedbagname || point.name;
            feedbagarray.push({
                feedBagID: "feed@" + idb.GenerateIDS(5),
                feedBagName: feedBagName
            });
        }


        const payload = {
            adminrawmaterialID: rawmaterialID || "raw@" + idb.GenerateIDS(5),
            stockPoints: stockarray,
            rawmaterials: rawmaterialarray,
            feedBags: feedbagarray
        };
        const doc = await rawmateriallist.findOne({});

        if (doc) {

            const existingStockPoints = doc.stockPoints.map(
                item => item.stockPointName.toLowerCase()
            );

            const existingRawMaterials = doc.rawmaterials.map(
                item => item.rawMaterialName.toLowerCase()
            );

            const existingFeedBags = doc.feedBags.map(
                item => item.feedBagName.toLowerCase()
            );

            const newStockPoints = stockarray.filter(
                item => !existingStockPoints.includes(item.stockPointName.toLowerCase())
            );

            const newRawMaterials = rawmaterialarray.filter(
                item => !existingRawMaterials.includes(item.rawMaterialName.toLowerCase())
            );

            const newFeedBags = feedbagarray.filter(
                item => !existingFeedBags.includes(item.feedBagName.toLowerCase())
            );

            await rawmateriallist.updateOne(
                { _id: doc._id },
                {
                    $push: {
                        stockPoints: { $each: newStockPoints },
                        rawmaterials: { $each: newRawMaterials },
                        feedBags: { $each: newFeedBags }
                    }
                }
            );

        } else {

            await rawmateriallist.create(payload);

        }

        return res.status(200).json({
            response: 3,
            message: "Admin data inserted successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const fetchadminstockpoints = async (req, res) => {
    try {
        const adminData = await rawmateriallist.findOne({});

        if (!adminData) {
            return res.status(200).json({
                success: false,
                message: "No admin stock points found",
                data: {
                    stockPoints: [],
                    rawmaterials: [],
                    feedBags: []
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Admin stock points fetched successfully",
            data: adminData
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const updateStockPoints = async (req, res) => {
    try {
        const { stockPointID, stockPointName, type } = req.body;

        if (!stockPointID || !stockPointName || !type) {
            return res.status(400).json({
                success: false,
                message: "stockPointID, stockPointName, and type are required"
            });
        }



        const doc = await rawmateriallist.findOne({});

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "No stock point data found"
            });
        }
        var existingPoint;
        var duplicateName;
        if (type === "rawmaterials") {
            existingPoint = doc.rawmaterials.find(
                item => item.rawMaterialID === stockPointID,
                 duplicateName = doc.rawmaterials.some(
                    item =>
                        item.rawMaterialID !== stockPointID &&
                        item.rawMaterialName.toLowerCase() === stockPointName.toLowerCase()
                )
            );
        }
        if (type === "feedBags") {
            existingPoint = doc.feedBags.find(
                item => item.feedBagID === stockPointID,
                 duplicateName = doc.feedBags.some(
                    item =>
                        item.feedBagID !== stockPointID &&
                        item.feedBagName.toLowerCase() === stockPointName.toLowerCase()
                )
            );
        }
        if (type === "stockPoints") {
            existingPoint = doc.stockPoints.find(
                item => item.stockPointID === stockPointID,
                duplicateName = doc.stockPoints.some(
                    item =>
                        item.stockPointID !== stockPointID &&
                        item.stockPointName.toLowerCase() === stockPointName.toLowerCase()
                )
            );
        }

            if (!existingPoint) {
                return res.status(404).json({
                    success: false,
                    message: "Stock point not found"
                });
            }

           

            if (duplicateName) {
                return res.status(400).json({
                    success: false,
                    message: "A stock point with that name already exists"
                });
            }

            if (type === "rawmaterials") {
                await rawmateriallist.updateOne(
                    { _id: doc._id, "rawmaterials.rawMaterialID": stockPointID },
                    { $set: { "rawmaterials.$.rawMaterialName": stockPointName } }
                );
            } else if (type === "feedBags") {
                await rawmateriallist.updateOne(
                    { _id: doc._id, "feedBags.feedBagID": stockPointID },
                    { $set: { "feedBags.$.feedBagName": stockPointName } }
                );
            } else {
                await rawmateriallist.updateOne(
                    { _id: doc._id, "stockPoints.stockPointID": stockPointID },
                    { $set: { "stockPoints.$.stockPointName": stockPointName } }
                );
            }

            return res.status(200).json({
                success: true,
                message: "Stock point updated successfully"
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    };

    const deleteStockPoints = async (req, res) => {
        try {
            const { stockPointID,type } = req.body;

            if (!stockPointID || !type) {
                return res.status(400).json({
                    success: false,
                    message: "stockPointID and type are required"
                });
            }

            const doc = await rawmateriallist.findOne({});

            if (!doc) {
                return res.status(404).json({
                    success: false,
                    message: "No stock point data found"
                });
            }
            let exists;
            let pullQuery;

            if (type === "rawmaterials") {
                exists = doc.rawmaterials.some(
                    item => item.rawMaterialID === stockPointID
                );
                pullQuery = { rawmaterials: { rawMaterialID: stockPointID } };
            } else if (type === "feedBags") {
                exists = doc.feedBags.some(
                    item => item.feedBagID === stockPointID
                );
                pullQuery = { feedBags: { feedBagID: stockPointID } };
            } else if (type === "stockPoints") {
                exists = doc.stockPoints.some(
                    item => item.stockPointID === stockPointID
                );
                pullQuery = { stockPoints: { stockPointID } };
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid type. Must be one of stockPoints, rawmaterials, feedBags"
                });
            }
            

            return res.status(200).json({
                success: true,
                message: "Stock point deleted successfully"
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    };

    module.exports = { addrawmateriallist, fetchadminstockpoints, updateStockPoints, deleteStockPoints };
