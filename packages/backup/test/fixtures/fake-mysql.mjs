import { writeFileSync } from "node:fs";

const chunks = [];
process.stdin.on("data", (chunk) => chunks.push(chunk));
process.stdin.on("end", () => {
  const captureFile = process.env.FAKE_MYSQL_CAPTURE_FILE;
  if (captureFile) {
    writeFileSync(captureFile, Buffer.concat(chunks));
  }
  process.exit(0);
});
