import nodemailer from "nodemailer";

export async function sendEmailNotification(order) {
  const transporter = nodemailer.createTransport({
    service: "gmail", // ggf. anpassen
    auth: {
      user: "youremail@example.com",
      pass: "yourpassword"
    }
  });

  const info = await transporter.sendMail({
    from: "no-reply@example.com",
    to: "info@firma.de", // Zieladresse(n)
    subject: `Neue Bestellung freigegeben: ${order.kundennummer}`,
    text: `Die Bestellung vom Benutzer ${order.username} wurde freigegeben.\n\nKundennummer: ${order.kundennummer}\nArtikel: ${order.artikel.length} Positionen`
  });

  console.log("📧 E-Mail versendet:", info.messageId);
}
