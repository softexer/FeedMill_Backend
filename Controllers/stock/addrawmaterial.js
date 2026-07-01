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

        if (!Array.isArray(stockPoints) || !Array.isArray(rawmaterials) || !Array.isArray(feedBags)) {
            return res.status(400).json({
                success: false,
                message: "stockPoints, rawmaterials and feedBags must be arrays"
            });
        }


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
        for (var i = 0; i < params.rawmaterials.length; i++) {
            const material = params.rawmaterials[i];
            rawmaterialarray.push({
                rawMaterialID: "raw@" + idb.GenerateIDS(5),
                rawMaterialName: material.rawMaterialName
            });
        }
        for (var i = 0; i < params.feedBags.length; i++) {
            const feed = params.feedBags[i];
            feedbagarray.push({
                feedBagID: "feed@" + idb.GenerateIDS(5),
                feedBagName: feed.feedBagName
            });
        }


        const payload = {
            rawmaterialID: rawmaterialID || "raw@" + idb.GenerateIDS(5),
            stockPoints: stockarray,
            rawmaterials: rawmaterialarray,
            feedBags: feedbagarray
        };
        var findstockpointsquery = await rawmateriallist.find({});

        if (findstockpointsquery.length > 0) {
            await rawmateriallist.updateOne(
                { _id: findstockpointsquery[0]._id },
                {
                    $push: {
                        stockPoints: { $each: stockarray },
                        rawmaterials: { $each: rawmaterialarray },
                        feedBags: { $each: feedbagarray }
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
module.exports = { addrawmateriallist,fetchadminstockpoints };
