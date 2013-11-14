connect-static2x
================

Middleware for connect which works the same as static() except with support for dynamic retina and resized images based on the filename of a jpeg or png.

This makes it incredibly easy to server dynamically sized images and support retina devices without having to worry about creating sprites or multiple versions of images. Retina support is a snap when used with something like [retina.js](http://retinajs.com/) on the frontend.

static2x will interpret and process any jpeg or png in the following format using the default options:

* `/example@2x.png` Nothing will happen. Original file will be returned instead of upscaling.
* `/example-200x200.png` The original file will be returned proportionally scaled to 200x200.
* `/example-200x200c.png` The original file will be returned proportionally scaled and cropped to 200x200.
* `/example-200x200c@2x.png` The original file will be returned proportionally scaled and cropped to 400x400.

## Options

This works exactly like [static()](http://www.senchalabs.org/connect/static.html) except for a few extra options:

* `maxSize` Array; An array representing the max width and height of a possible resize. Set to false to not allow resizes. Default: [1000, 1000]
* `allowCropping` Boolean; Allow cropping for a requested image. Default: true
* `allowRetina` Boolean; Allow for retina requests (@2x). Note that if a image without a specific size is requested (e.g. example@2x.png), the original image will be returned instead of upscaling.

## Usage

```
express() // or connect()
  .use(require("connect-static2x")(__dirname + "/public", {
    maxSize: [1500, 1500]
  }))
  .listen(3000);
```

