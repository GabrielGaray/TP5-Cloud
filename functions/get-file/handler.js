"use strict";
const mongo = require("mongodb").MongoClient;

const mongoConnection = new Promise((resolve, reject) =>
  mongo.connect(
    "mongodb://mongodb:27017",
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err, db) => (err ? reject(err) : resolve(db))
  )
);

module.exports = async (req, res) => {
  try {
    const dbConnection = await mongoConnection;
    let filter = {};

    if (req.path !== "/") {
      filter = { _id: req.path.substr(1) };
      const file = await dbConnection
        .db("tp-final")
        .collection("files")
        .findOne(filter);
      res.status(200).succeed(JSON.stringify(file));
    } else {
      if (req.query.type) {
        filter = { ...filter, type: req.query.type };
      }
      if (req.query.name) {
        const filterExpression = new RegExp(req.query.name, "gi");
        filter = { ...filter, name: filterExpression };
      }
      if (req.query.from && req.query.to) {
        filter = {
          ...filter,
          $and: [
            { date: { $gte: new Date(req.query.from *1000) } },
            { date: { $lte: new Date(req.query.to *1000) } }
          ]
        };
      }
      const listFile = await dbConnection
        .db("tp5")
        .collection("files")
        .find(filter).sort({'name': 1})
        .toArray()
      res.status(200).succeed(JSON.stringify(listFile));
    }
  } catch (error) {
    console.log("TCL: error", error);
    res.status(400).fail(error);
  }
};