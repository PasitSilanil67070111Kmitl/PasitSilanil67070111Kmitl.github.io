function cookieParser(req, _res, next) {
  req.cookies = {};
  const header = req.headers.cookie;
  if (header) {
    header.split(";").forEach(part => {
      const index = part.indexOf("=");
      if (index < 0) return;
      const name = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      try {
        req.cookies[name] = decodeURIComponent(value);
      } catch (_error) {
        req.cookies[name] = value;
      }
    });
  }
  next();
}

module.exports = cookieParser;
