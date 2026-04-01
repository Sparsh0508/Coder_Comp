module.exports = (socket, next) => {
  try {
    const userId = socket.handshake.auth.userId;

    if (!userId) {
      return next(new Error("Unauthorized"));
    }

    socket.user = { id: userId };

    next();
  } catch (err) {
    next(new Error("Auth error"));
  }
};