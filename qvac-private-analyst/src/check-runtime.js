const [major, minor] = process.versions.node.split(".").map(Number);

if (major < 22 || (major === 22 && minor < 17)) {
  console.error(`Node ${process.versions.node} detected. QVAC requires Node >= 22.17.0.`);
  console.error("Install a newer Node.js before running real QVAC inference.");
  process.exitCode = 1;
} else {
  console.log(`Node ${process.versions.node} is ready for QVAC.`);
}
