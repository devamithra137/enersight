// sockets/socketHandler.js
// Initialises Socket.IO and sets up connection lifecycle events.
// The io instance is stored on the Express app so controllers can emit from HTTP handlers.

const anomalyService = require("../services/anomalyService");

function toPlainReading(entry) {
  if (!entry) return entry;
  if (typeof entry.toObject === "function") {
    return entry.toObject();
  }
  return entry;
}

/**
 * Attaches Socket.IO event handlers to the given server instance.
 * @param {import("socket.io").Server} io
 */
function initSocket(io) {
  io.on("connection", (socket) => {
    console.log(`[socket] client connected → ${socket.id}`);

    // ── Welcome / handshake ─────────────────────────────────────────────────
    socket.emit("connected", {
      message: "Connected to EnerSight real-time feed",
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

    // ── Client subscribes to a specific device feed ─────────────────────────
    socket.on("subscribe:device", (deviceId) => {
      socket.join(`device:${deviceId}`);
      console.log(`[socket] ${socket.id} subscribed to device:${deviceId}`);
    });

    // ── Client requests on-demand anomaly scan ──────────────────────────────
    socket.on("request:anomaly_scan", async () => {
      try {
        const result = await anomalyService.detectAnomalies();
        socket.emit("anomaly:scan_result", result);
      } catch (err) {
        socket.emit("anomaly:scan_error", { error: err.message });
      }
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[socket] client disconnected → ${socket.id} (${reason})`);
    });
  });
}

/**
 * Emits "energy:update" to all connected clients (or a device-scoped room).
 * Called by the data simulator and the POST /api/energy controller.
 *
 * @param {import("socket.io").Server} io
 * @param {Object} entry  - saved EnergyData document
 */
function emitEnergyUpdate(io, entry, meta = {}) {
  const liveData = Array.isArray(meta.liveData)
    ? meta.liveData.map(toPlainReading)
    : null;
  const normalizedEntry = Array.isArray(entry)
    ? entry.map(toPlainReading)
    : toPlainReading(entry);
  const latestReading = liveData
    ? liveData[liveData.length - 1]
    : Array.isArray(normalizedEntry)
      ? normalizedEntry[normalizedEntry.length - 1]
      : normalizedEntry;
  const payload = {
    event: "energy:update",
    data: liveData || normalizedEntry,
    reading: latestReading,
    meta,
    timestamp: new Date().toISOString(),
  };

  // Broadcast to all clients
  io.emit("energy:update", payload);

  // Also broadcast to device-specific room if deviceId is present
  if (latestReading && latestReading.deviceId) {
    io.to(`device:${latestReading.deviceId}`).emit("energy:update", payload);
  }
}

/**
 * Emits "energy:alert" when an anomaly is detected.
 *
 * @param {import("socket.io").Server} io
 * @param {Object} alertPayload
 */
function emitEnergyAlert(io, alertPayload) {
  io.emit("energy:alert", {
    event: "energy:alert",
    ...alertPayload,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { initSocket, emitEnergyUpdate, emitEnergyAlert };
