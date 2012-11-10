"use strict";

// Displays the HTML source of a CodeMirror editor as a rendered preview
// in an iframe.
define(["jquery", "backbone-events"], function($, BackboneEvents) {
  function LivePreview(options) {
    var self = {codeMirror: options.codeMirror},
        codeMirror = options.codeMirror,
        Slowparse = options.slowparse,
        iframe = document.createElement("iframe"),
        frame;

    // set up the iframe
    options.previewArea.append(iframe);

    // set up the reparse handling
    codeMirror.on("reparse", function(event) {
      var isPreviewInDocument = $.contains(document.documentElement,
                                           options.previewArea[0]);
      if (!isPreviewInDocument) {
        if (window.console)
          window.console.log("reparse triggered, but preview area is not " +
                             "attached to the document.");
        return;
      }

      if (!event.error || options.ignoreErrors) {

        // shortcut!
        var ret = Slowparse.HTML(document, event.sourceCode);
        if(ret.error) { return; }

        if(frame) {
          var d1 = document.createElement("div");
          d1.innerHTML = event.sourceCode;
          var d2 = document.createElement("div");
          d2.innerHTML = frame.body.innerHTML;
          var log = diffApply(d1, d2, frame);
        }

        else {
          var sourceCode = event.sourceCode;
          var loadFunction = function() {
            frame = new Frame(iframe);
            frame.document.removeEventListener("DOMContentLoaded", loadFunction, false);
            iframe.contentWindow.document.body.innerHTML = sourceCode;
            frame.scanForScripts();
          };

          $(iframe).ready(loadFunction);
          return;
        }
      }
    });

    BackboneEvents.mixin(self);
    return self;
  };

  return LivePreview;
});
