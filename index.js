const express = require("express");
const cors = require("cors");
require("dotenv").config();
// console.log("Mongo URI:", process.env.MONGODB_URI);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 8000;

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("TricketVerce");

    const ticketCollection = db.collection("tricket");
    const ticketCollectionPayment = db.collection("tricketpayment");
    const bookingCollection = db.collection("bookings");
    const userCollection = db.collection("users");

    console.log("MongoDB Connected Successfully");

    // ======================
    // Get All Tickets
    // ======================

    app.get("/tricket", async (req, res) => {
      const { transportType, from, to, sort } = req.query;

       let query = {};

      if (transportType) {
        query.transportType = transportType;
      }

      if (from) {
        query.from = {
          $regex: from,
          $options: "i",
        };
      }

      if (to) {
        query.to = {
          $regex: to,
          $options: "i",
        };
      }

      let sortOption = {};

      if (sort === "asc") {
        sortOption.price = 1;
      }

      if (sort === "desc") {
        sortOption.price = -1;
      }

      const result = await ticketCollection
        .find(query)
        .sort(sortOption)
        .toArray();

      res.send(result);
    });
    // ======================
    // Get Single Ticket
    // ======================

  app.get("/tricket/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await ticketCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!result) {
      return res.status(404).send({
        message: "Ticket Not Found",
      });
    }

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
});

    // ======================
    // Add Ticket
    // ======================

    app.post("/tricket", async (req, res) => {
      const ticket = req.body;

      ticket.verificationStatus = "pending";
      ticket.advertised = false;
      ticket.createdAt = new Date();

      const result = await ticketCollection.insertOne(ticket);

      res.send(result);
    });

    // ======================
    // Update Ticket
    // ======================

    app.patch("/tricket/:id", async (req, res) => {
      const id = req.params.id;

      const updatedData = req.body;

      const result = await ticketCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: updatedData,
        }
      );

      res.send(result);
    });

    // ======================
    // Delete Ticket
    // ======================

    app.delete("/tricket/:id", async (req, res) => {
      const id = req.params.id;

      const result = await ticketCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // ======================
    // Book Ticket
    // ======================

    app.post("/bookings", async (req, res) => {
      const booking = req.body;

      booking.status = "pending";
      booking.createdAt = new Date();

      const result = await bookingCollection.insertOne(booking);

      res.send(result);
    });

    // ======================
    // My Bookings
    // ======================

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;

      const result = await bookingCollection
        .find({
          userEmail: email,
        })
        .toArray();

      res.send(result);
    });

    // ======================
    // Users
    // ======================

    app.post("/users", async (req, res) => {
      const user = req.body;

      const exists = await userCollection.findOne({
        email: user.email,
      });

      if (exists) {
        return res.send({
          message: "User already exists",
        });
      }

      const result = await userCollection.insertOne({
        ...user,
        role: "user",
      });

      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();

      res.send(result);
    });

    // ======================
    // Make Vendor
    // ======================

    app.patch("/users/vendor/:id", async (req, res) => {
      const id = req.params.id;

      const result = await userCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            role: "vendor",
          },
        }
      );

      res.send(result);
    });

    // ======================
    // Make Admin
    // ======================

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;

      const result = await userCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            role: "admin",
          },
        }
      );

      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });

    console.log("Pinged MongoDB");
  } catch (error) {
    console.log(error);
  }
}

run();

app.get("/", (req, res) => {
  res.send("TicketVerse Server Running");
});

app.listen(port, () => {
  console.log(`Server Running on Port ${port}`);
});