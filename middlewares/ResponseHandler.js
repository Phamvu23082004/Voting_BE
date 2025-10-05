const responseHandler = (req, res, next) => {
  res.success = (result = null, message = "Thành công", status = 200) => {
    return res.status(status).json({
      EC: 0,
      EM: message,
      result,
    });
  };

  res.error = (errorCode = 1, message = "Lỗi xử lý yêu cầu", status = 400) => {
    return res.status(status).json({
      EC: errorCode,
      EM: message,
    });
  };

  res.InternalError = (message = "Lỗi hệ thống !!!") => {
    return res.status(500).json({
      EC: -1,
      EM: message,
    });
  };

  next();
};

module.exports = responseHandler;
