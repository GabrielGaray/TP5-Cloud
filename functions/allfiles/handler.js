"use strict";
const mongo = require("mongodb").MongoClient;

const mongoConnection = new Promise((resolve, reject) =>
  mongo.connect(
    "mongodb://mongodb:27017",
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err, db) => (err ? reject(err) : resolve(db))
  )
);

module.exports = async (event, context) => {
  try {
    if (event.body.Key) {
      const dbConnection = await mongoConnection;

      const bucket = event.body.Key.split("/")[0];
      const name = event.body.Key.split("/")[1].split(".")[0];
      const type = event.body.Key.split("/")[1].split(".")[1];

      const record = event.body.Records[0]; //para en el caso que llegue uno, ya que es un array
      await dbConnection
        .db("tp5")
        .collection("files")
        .update(
          {
            _id: event.body.Key
          },
          {
            $set: {
              _id: event.body.Key,
              bucket,
              name,
              type,
              date: new Date(record.eventTime),
              size: record.s3.object.size
            }
          },
          { upsert: true } //si encuentra otro con el mismo key lo modifica
        );
      context.status(200).succeed("File created!");
    } else context.status(400).fail("Error");
  } catch (error) {
    console.log("TCL: error", error);
    context.status(400).fail(error);
  }
};
