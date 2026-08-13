// server.js
// EnerSight — Intelligent Energy Consumption Monitoring System
// Entry point: bootstraps Express, MongoDB, Socket.IO, and the background simulator.

require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const energyRoutes = require("./routes/energy");
const recommendationRoutes = require("./routes/recommendations");
const alertRoutes = require("./routes/alerts");
const analysisRoutes = require("./routes/analysis");
const { initSocket } = require("./sockets/socketHandler");
const { startSimulator, stopSimulator } = require("./utils/simulator");

// ── App setup ─────────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);

// Socket.IO mounted on the same HTTP server — allows shared port
const io = new Server(server, {
  cors: {
    origin: "*", // Tighten to your frontend domain in production
    methods: ["GET", "POST"],
  },
  // Ping clients every 25 s; disconnect if no pong within 60 s
  pingInterval: 25000,
  pingTimeout: 60000,
});

// Make `io` available to any Express controller via req.app.get("io")
app.set("io", io);

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger (swap for Morgan / Winston in production)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/api/energy", energyRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/analysis", analysisRoutes);

// Test route
app.get("/test", (req, res) => {
  res.send("Server working ✅");
});

// Health check — useful for container orchestration / load-balancers
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "EnerSight Backend",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[unhandled error]", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ── MongoDB connection ─────────────────────────────────────────────────────────

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  await mongoose.connect(uri);

  console.log("MongoDB Connected ✅");
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  try {
    await connectDB();

    // Wire up Socket.IO connection handlers
    initSocket(io);

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`\n🚀  EnerSight backend running on port ${PORT}`);
      console.log(`   REST  → http://localhost:${PORT}/api/energy`);
      console.log(`   WS    → ws://localhost:${PORT}\n`);

      // Start the real-time data simulator after the server is listening
      startSimulator(io);
    });
  } catch (err) {
    console.error("[bootstrap] fatal error:", err.message);
    process.exit(1);
  }
}

bootstrap();

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function shutdown(signal) {
  console.log(`\n[shutdown] received ${signal}`);
  stopSimulator();
  await mongoose.disconnect();
  server.close(() => {
    console.log("[shutdown] HTTP server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
