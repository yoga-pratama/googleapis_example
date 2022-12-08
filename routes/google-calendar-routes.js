const express = require("express");
const crtl = require("../controllers/google_calendar/google-calendar-controller");

const router = express.Router();

router.post("/add_event", crtl.insertEvent);
router.post("/update_event", crtl.updateEvent);
router.post("/delete_event", crtl.deleteEvent);
router.get("/get_event_list", crtl.listEvent);
module.exports = router;
