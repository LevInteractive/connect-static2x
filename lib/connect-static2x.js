/*!
 * connect-static2x
 * Copyright(c) 2014 Pete Saia
 * MIT Licensed
 */

var gm = require('gm');
var url = require("url");
var util = require("util");
var utils = require("./utils");
var connectUtils = require("../node_modules/connect/lib/utils");
var send = require("send");
var path = require("path");
var fs = require("fs");
var parse = connectUtils.parseUrl;

exports = module.exports = function(root, options) {

  // Options for image resizing.
  options = options || {};

  // The maximum size allowed for generating ([w, h]). Note that this not count for retina images.
  // For example a resize of 1000x1000 would still result in 2000x2000. Set to false to not Allow
  // resizing.
  var maxSize = typeof options.maxSize === "undefined" ? [1000, 1000] : options.maxSize;

  // Allow for cropping.
  var allowCropping = typeof options.allowCropping === "undefined" ? true : options.allowCropping;

  // Allow for retina resizing.
  var allowRetina = typeof options.allowRetina === "undefined" ? true : options.allowRetina;

  // default redirect
  var redirect = false !== options.redirect;
  
  // Require a static root for http requests.
  if (!root) {
    throw new Error('static root path required.');
  }

  return function(req, res, next) {
    if ('GET' != req.method && 'HEAD' != req.method) {
      return next();
    }
    var pathname = parse(req).pathname;
    var originalUrl = url.parse(req.originalUrl);
    var pause = connectUtils.pause(req);

    if (pathname === '/' && originalUrl.pathname[originalUrl.pathname.length - 1] !== '/') {
      return directory();
    }

    function resume() {
      next();
      pause.resume();
    }

    function directory() {
      if (!redirect) return resume();
      var target;
      originalUrl.pathname += '/';
      target = url.format(originalUrl);
      res.statusCode = 303;
      res.setHeader('Location', target);
      res.end('Redirecting to ' + connectUtils.escape(target));
    }

    function error(err) {
      var _gm,
          parsedImage,
          ext, extLower,
          originalFileAbsPath,
          dirRelPath,
          dirAbsPath,
          actualWidth,
          actualHeight,
          newImageName;

      if (404 == err.status) {
        ext = utils.getExt(pathname);
        extLower = ext.toLowerCase();
        dirRelPath = pathname.substr(0, pathname.lastIndexOf("/")) + "/";
        dirAbsPath = path.join(
          path.normalize(root), 
          dirRelPath,
          "/"
        );

        // Check to see if we're dealing with an image.
        if ("jpg" === extLower || "png" === extLower || "jpeg" === extLower) {
          parsedImage = utils.parseFileName(utils.getFileName(pathname));

          // First check image size because it's quick.
          if (parsedImage.width) {
            if (!maxSize ||
              parsedImage.width > maxSize[0] ||
              parsedImage.height > maxSize[1]) {
              return resume(); // Out of size range or doesn't support resizing.
            }
          }

          // Check to see if the original image exists.
          originalFileAbsPath = dirAbsPath + parsedImage.base + "." + ext;
          if (!fs.existsSync(originalFileAbsPath)) {
            return resume(); // Not even an original. 404.
          }

          // If retina but has no resizing, just return original.
          if (parsedImage.retina && !parsedImage.width) {
            return doSend(dirRelPath + parsedImage.base + "." + ext);
          }


          // This should never be the case, but for safety.
          if (!parsedImage.width || !parsedImage.height) {
            return resume();
          }

          // Start processessing.
          _gm = gm(originalFileAbsPath).autoOrient();
          actualWidth = allowRetina && parsedImage.retina ? Math.round(parsedImage.width * 2) : parsedImage.width;
          actualHeight = allowRetina && parsedImage.retina ? Math.round(parsedImage.height * 2) : parsedImage.height;
          _gm.resize(actualWidth, actualHeight);

          if (allowCropping && parsedImage.crop) {
            _gm.crop(actualWidth, actualHeight);
          }
          
          newImageName = parsedImage.base +
            "-" + parsedImage.width +
            "x" + parsedImage.height +
            (parsedImage.crop ? "c" : "") +
            (parsedImage.retina ? "@2x" : "") +
            "." + ext;

          _gm.write(dirAbsPath + newImageName, function (err) {
            if (err) {
              return resume();
            }
            return doSend(dirRelPath + newImageName);
          });
        } else {
          return resume();
        }
      } else {
        next(err);
      }
    }

    function doSend(p) {
      send(req, p)
        .maxage(options.maxAge || 0)
        .root(root)
        .on('error', error)
        .on('directory', directory)
        .index(options.index || 'index.html')
        .hidden(false)
        .pipe(res);
    }
    doSend(pathname);
  };
};



