const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// serve static files
app.use(express.static(path.join(__dirname)));

// fallback to chat-script.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "chat-script.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
