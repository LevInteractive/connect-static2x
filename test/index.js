var connect = require("connect");
var request = require("supertest");
var assert = require("assert");
var fs = require("fs");

describe("Utils", function() {
  var utils = require("../lib/utils");
  it("should return a files name properly", function() {
    assert.equal(utils.getFileName("/some/file/name.jpg"), "name");
    assert.equal(utils.getFileName("/another.jpg"), "another");
    assert.equal(utils.getFileName("/another"), "");
  });
  it("should return a file's extension", function() {
    assert.equal(utils.getExt("file.jpg"), "jpg");
    assert.equal(utils.getExt("file"), "");
  });
  it("should parse an image name properly", function() {
    var opts = utils.parseFileName("some-name");
    assert.equal(opts.retina, false);
    assert.equal(opts.crop, false);
    assert.equal(opts.base, "some-name");
    assert.equal(opts.width, null);
    assert.equal(opts.height, null);
    opts = utils.parseFileName("some-name-");
    assert.equal(opts.retina, false);
    assert.equal(opts.crop, false);
    assert.equal(opts.base, "some-name-");
    assert.equal(opts.width, null);
    assert.equal(opts.height, null);
    opts = utils.parseFileName("some-name@2x");
    assert.equal(opts.retina, true);
    assert.equal(opts.crop, false);
    assert.equal(opts.base, "some-name");
    assert.equal(opts.width, null);
    assert.equal(opts.height, null);
    opts = utils.parseFileName("some-namec@2x");
    assert.equal(opts.retina, true);
    assert.equal(opts.crop, false);
    assert.equal(opts.base, "some-namec");
    assert.equal(opts.width, null);
    assert.equal(opts.height, null);
    opts = utils.parseFileName("some-namec-100x200@2x");
    assert.equal(opts.retina, true);
    assert.equal(opts.crop, false);
    assert.equal(opts.base, "some-namec");
    assert.equal(opts.width, 100);
    assert.equal(opts.height, 200);
    opts = utils.parseFileName("some-name-100x200c@2x");
    assert.equal(opts.retina, true);
    assert.equal(opts.crop, true);
    assert.equal(opts.base, "some-name");
    assert.equal(opts.width, 100);
    assert.equal(opts.height, 200);
    opts = utils.parseFileName("some-name--100x200c@2x");
    assert.equal(opts.retina, true);
    assert.equal(opts.crop, true);
    assert.equal(opts.base, "some-name-");
    assert.equal(opts.width, 100);
    assert.equal(opts.height, 200);
  });
});

describe("Middleware http requests", function() {

  // Configure middleware.
  var static2x = require("../index")(__dirname + "/images");

  // Start up a dummy Connect http server.
  var server = connect().use(static2x).listen(3001);

  it("should get a 404 when the image does not exist", function(done) {
    request(server)
      .get("/nada.png")
      .expect(404, done);
  });

  it("should handle non image files like normal", function(done) {
    request(server)
      .get("/notallowed.txt")
      .expect(200, done);
  });

  it("should return an image that exists", function(done) {
    request(server)
      .get("/sample.png")
      .expect(200, done);
  });

  it("should return original file if retina is desired without a specific size", function(done) {
    request(server)
      .get("/sample@2x.png")
      .expect(200, done);
  });

  it("should return new resized image properly", function(done) {
    request(server)
      .get("/sample-200x200.png")
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        fs.unlinkSync(__dirname + "/images/sample-200x200.png");
        done();
      });
  });
});
