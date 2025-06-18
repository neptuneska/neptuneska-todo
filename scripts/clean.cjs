const { exec } = require("child_process");
const os = require("os");
const cmd = os.platform().startsWith("win")
  ? "rmdir /s /q .next & rmdir /s /q next"
  : "rm -rf .next next";
exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erreur: ${error.message}`);
    return;
  }
  console.log("Suppression terminée.");
});