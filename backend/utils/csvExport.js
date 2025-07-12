import fs from "fs";
import path from "path";
import Client from "ssh2-sftp-client";

export async function exportToCSV(order, artikelPath) {
  const artikelLines = fs.readFileSync(artikelPath, "utf8").split("\n");
  const lookup = Object.fromEntries(artikelLines.map(line => {
    const [nr, name] = line.split("|");
    return [nr.trim(), name?.trim()];
  }));

  const filename = `bestellung_${order.kundennummer}_${order.timestamp}.csv`;
  const content = order.artikel.map(item =>
    [order.kundennummer, item.sku, item.quantity, item.unit].join("|")
  ).join("\n");

  const filepath = path.join("data", filename);
  fs.writeFileSync(filepath, content);

  const sftp = new Client();
  await sftp.connect({
    host: "ssh.strato.de",
    port: 22,
    username: "sftp_n8nData@domlab.de",
    password: "1PvdXQKv9CruWzv9nbPP"
  });
  await sftp.put(filepath, filename);
  await sftp.end();
}
