const fs = require("fs");
const path = require("path");

const logFilePath = "./logs/res.txt";

function ensureLogDirectoryExists() {
  const logDir = path.dirname(logFilePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function writeLog(message) {
  try {
    ensureLogDirectoryExists();
    const logMessage = `${new Date().toISOString()} - ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
  } catch (err) {
    console.error("Erreur lors de l'écriture dans le fichier de log :", err);
  }
}

writeLog("Début de la vérification du message de commit");

const msgPath = process.argv[2];
if (!msgPath) {
  console.error("Chemin du fichier de commit non spécifié");
  process.exit(1);
}

try {
  const message = fs.readFileSync(msgPath, "utf8").trim();

  const commitRegex =
    /^\[TLKMSTR-\d+\]\s+(feat|fix|chore)\((front|back)\):\s.+$/;

  if (!commitRegex.test(message)) {
    console.error(
      "\n❌ Mauvais format de commit.\n\nExemple attendu :\n[TLKMSTR-XXX] feat/chore/fix(front/back): short description"
    );
    writeLog("Mauvais format de commit.");
    process.exit(1);
  }

  writeLog("Message de commit valide: " + message);
} catch (err) {
  console.error("Erreur lors de la lecture du fichier de commit:", err);
  process.exit(1);
}
