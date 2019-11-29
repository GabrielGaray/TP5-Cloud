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
    const {
      query: { size }
    } = req;

    const filter = {
      S: { $or: [{ heigth: { $lte: 500 } }, { width: { $lte: 500 } }] },
      M: { $or: [{ heigth: { $gt: 500 } }, { width: { $gt: 500 } }] },
      L: { $and: [{ heigth: { $gt: 100 } }, { width: { $gt: 100 } }] }
    };

    const listFile = await dbConnection
      .db("tp5")
      .collection("files")
      .find(filter[size])
      .sort({ name: 1 })
      .toArray();
    res.status(200).succeed(JSON.stringify(listFile));
  } catch (error) {
    console.log("TCL: error", error);
    res.status(400).fail(error);
  }
};
