const sendServerError = (res, error, logPrefix = "") => {
  // Log the error server-side
  console.error(logPrefix, error);
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({ message: "Server error" });
  }
  return res
    .status(500)
    .json({ message: "Server error", error: error?.message || String(error) });
};
// export default sendServerError;
module.exports = sendServerError;