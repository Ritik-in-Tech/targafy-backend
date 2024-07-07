import moment from "moment-timezone";
const timeZone = "Asia/Kolkata";

export const parseDateInLocalTime = (dateString) => {
  const date = moment.tz(dateString, timeZone);
  if (!date.isValid()) {
    throw new Error("Invalid Date");
  }
  return date;
};
