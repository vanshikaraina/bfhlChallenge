const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const bfhlRoute = require("./routes/bfhl");

app.use("/bfhl", bfhlRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});