import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const users = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/users.json")));

export function authenticate(username, password) {
  return users.find(u => u.username === username && u.password === password);
}

export function isAdmin(username) {
  const user = users.find(u => u.username === username);
  return user?.role === "admin";
}
