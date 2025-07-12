import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { authenticate, isAdmin } from "./utils/auth.js";
import { exportToCSV } from "./utils/csvExport.js";
import { sendEmailNotification } from "./utils/mailer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const bestellungenPath = path.join(__dirname, "data", "bestellungen.json");
const artikelPath = path.join(__dirname, "data", "artikel.csv");

const loadOrders = () => fs.existsSync(bestellungenPath)
  ? JSON.parse(fs.readFileSync(bestellungenPath, "utf8"))
  : [];

const saveOrders = (orders) =>
  fs.writeFileSync(bestellungenPath, JSON.stringify(orders, null, 2), "utf8");

// 🔐 Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = authenticate(username, password);
  if (user) {
    res.json({ success: true, role: user.role });
  } else {
    res.status(401).json({ success: false });
  }
});

// 📝 Neue Bestellung
app.post("/order", (req, res) => {
  const { username, kundennummer, adresse, artikel, verweis } = req.body;
  const orders = loadOrders();
  const timestamp = Date.now();

  orders.push({ username, kundennummer, adresse, artikel, verweis, status: "offen", timestamp });
  saveOrders(orders);

  res.json({ success: true });
});

// 📦 Alle Bestellungen (admin oder user)
app.get("/orders/:username", (req, res) => {
  const { username } = req.params;
  const all = loadOrders();
  const user = authenticate(username);
  if (!user) return res.status(403).json({ error: "Nicht erlaubt" });
  const data = isAdmin(username) ? all : all.filter(o => o.username === username);
  res.json(data);
});

// ✅ Freigabe & CSV + SFTP + Mail
app.put("/order/:timestamp/submit", async (req, res) => {
  const timestamp = parseInt(req.params.timestamp);
  const orders = loadOrders();
  const index = orders.findIndex(o => o.timestamp === timestamp);
  if (index === -1) return res.status(404).json({ error: "Bestellung nicht gefunden" });

  const order = orders[index];
  try {
    await exportToCSV(order, artikelPath);
    await sendEmailNotification(order);
    orders[index].status = "freigegeben";
    saveOrders(orders);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔎 Bezeichnung aus CSV
app.get("/artikel/:sku", (req, res) => {
  const sku = req.params.sku.trim();
  const lines = fs.readFileSync(artikelPath, "utf8").split("\n");
  const lookup = Object.fromEntries(lines.map(l => l.split("|").map(e => e.trim())));
  res.json({ bezeichnung: lookup[sku] || "" });
});

// 🔧 Benutzerliste (Admin)
app.get("/users", (req, res) => {
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "users.json"), "utf8"));
  res.json(users.map(({ password, ...rest }) => rest));
});

app.listen(PORT, () => console.log("🚀 Backend läuft auf Port", PORT));
