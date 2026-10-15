const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter the initial admin password (input may be visible): ", async (password) => {
  try {
    if (!password || password.length < 12) {
      console.error("Use a password of at least 12 characters.");
      process.exitCode = 1;
    } else {
      console.log("\nADMIN_PASSWORD_HASH=" + await bcrypt.hash(password, 12));
    }
  } finally {
    rl.close();
  }
});
