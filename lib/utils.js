/**
 * Returns only the filename from a path.
 *
 * getFileName("/some/file/path/to/here.jpg")
 * => "here"
 *
 * @param {String} path
* @return {String}
 * @api private
 */
var getFileName = exports.getFileName = function(path) {
  var fullfile = path.split('/').pop();
  return fullfile.match(/\./) ? fullfile.replace(/\.[0-9a-z]+$/i, "") : "";
};

/**
 * Returns only the file extension.
 *
 * getExt("/some/file/path/to/here.jpg")
 * => "jpg"
 *
 * @param {String} path
 * @return {String}
 * @api private
 */
var getExt = exports.getExt = function(path) {
  var match = path.match(/\.([0-9a-z]+$)/i);
  if (match) {
    return match[1];
  }
  return "";
};

/**
 * Parse the filename for size, crop, and retina information.
 * Note: [*."/\[]:;|=,] are NOT allowed to be in a filename.
 *
 * parseFileName("example-100x200c@2x")
 * => { base: "example", width: 100, height: 200, crop: true, retina: true }
 *
 * parseFileName("example")
 * => { base: "example", width: null, height: null, crop: false, retina: false } 
 *
 * @param {String} file name
 * @return {Object}
 * @api private
 */
var parseFileName = exports.parseFileName = function(name) {
  var data = {
    base: name,
    width: null,
    height: null,
    crop: false,
    retina: false
  };

  // Check name for retina.
  var retinaMatch = data.base.match(/@2x$/);
  if (retinaMatch) {
    data.retina = true;
    data.base = data.base.replace(/@2x$/, "");
  }

  // Check for cropping.
  var cropMatch = data.base.match(/-[\d]+x[\d]+c$/);
  if (cropMatch) {
    data.crop = true;
    data.base = data.base.replace(/c$/, "");
  }

  // Check for size constraints.
  var resizeMatch = data.base.match(/-([\d]+)x([\d]+)$/);
  if (resizeMatch) {
    data.width = parseInt(resizeMatch[1], 10);
    data.height = parseInt(resizeMatch[2], 10);
    data.base = data.base.replace(/-[\d]+x[\d]+$/, "");
  }

  return data;
};

