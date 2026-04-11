function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function setAuthCookie(res, token) {
  res.cookie("token", token, baseCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie("token", baseCookieOptions());
}

module.exports = {
  setAuthCookie,
  clearAuthCookie,
};
