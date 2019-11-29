"use strict";
const mongo = require("mongodb").MongoClient;
const imageSize = require("image-size");
var Minio = require("minio");

var minioClient = new Minio.Client({
  endPoint: "minio",
  port: 9000,
  useSSL: false,
  accessKey: "minio",
  secretKey: "minio123"
});

const mongoConnection = new Promise((resolve, reject) =>
  mongo.connect(
    "mongodb://mongodb:27017",
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err, db) => (err ? reject(err) : resolve(db))
  )
);

const splitKey = key => ({
  bucket: key.split("/")[0],
  fullName: key.split("/")[1],
  name: key.split("/")[1].split(".")[0],
  type: key.split("/")[1].split(".")[1]
});

module.exports = async (event, context) => {
  try {
    if (event.body.Key) {
      const fileInfo = splitKey(event.body.Key);
      const dbConnection = await mongoConnection;
      let listChunk = [];
      let stream;
      minioClient.getObject(fileInfo.bucket, fileInfo.fullName, function(
        err,
        dataStream
      ) {
        if (err) {
          return console.log(err);
        }
        dataStream.on("data", function(chunk) {
          listChunk.push(chunk);
        });
        dataStream.on("end", async () => {
          stream = Buffer.concat(listChunk);
          const dimensions = imageSize(stream);
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
                  width: dimensions.width,
                  height: dimensions.height
                }
              },
              { upsert: true }
            );
          context.status(200).succeed("Done!");
        });
        dataStream.on("error", function(err) {
          console.log(err);
        });
      });      
    } else context.status(400).fail("Error");
  } catch (error) {
    console.log("TCL: error", error);
    context.status(400).fail(error);
  }
};