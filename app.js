const express = require("express");
const bodyParser = require("body-parser");

//routes
const googleCalendarRoutes = require("./routes/google-calendar-routes");

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With,Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");
  next();
});

app.use("/api/calendar", googleCalendarRoutes);

app.listen(process.env.PORT || 3000);
