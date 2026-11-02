function notFound(req, res) {
  res.status(404).json({ message: "Route not found." });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Something went wrong on the server.",
  });
}

module.exports = { notFound, errorHandler };
