/**
 * iframe mirroring object. This lets us
 * keep a persistent reference to its content.
 */
(function(){

  /**
   * Constructor: bind the iframe's
   * window, document, head and body.
   */
  var Frame = function(iframe) {
    if(!Frame.instances) {
      Frame.instances = [];
    }

    // essential for IE (and possible other browsers)
    iframe.contentEditable = true;

    this.window = iframe.contentWindow;
    this.document = iframe.contentWindow.document;
    this.head = iframe.contentWindow.document.head;
    this.body = iframe.contentWindow.document.body;

    Frame.instances.push(this);
  }

  /**
   * Prototype function definitions.
   */
  Frame.prototype = {

    /**
     * find an element in the DOM tree
     */
    find: function(treeRoute) {
      var e = this.body,
          route = snapshot(treeRoute),
          pos = route.splice(0,1)[0];
      while(pos!==-1) {
        e = e.childNodes[pos];
        pos = route.splice(0,1)[0];
      }
      return e;
    },

    /**
     * Does this frame already contain this
     * script (in the head)?
     */
    containsScript: function(script) {
      var set = snapshot(this.head.children),
          s, last=set.length;
      for(s=0; s<last; s++) {
        if(script.src === set[s].src) { return true; }
        if(script.innerHTML.trim() !== "" && script.innerHTML === set[s].innerHTML) { return true; }
      }
      return false;
    },

    scriptBindings: [],

    /**
     * Script loading inside the frame
     */
    addScript: function(element) {
      if(this.containsScript(element)) return;

      var script = document.createElement("script");
      script.type = "text/javascript";
      // load from source?
      if(element.getAttribute("src")) {
        var src = element.getAttribute("src");
        script.src = src
      }
      else { script.innerHTML = element.textContent; }
      try {
        this.head.appendChild(script);
        this.scriptBindings.push([element, script]);
      }
      catch (e) { console.log("runtime error - probably bad syntax"); }
    },

    /**
     * remove a script from the head.
     */
    removeScript: function(element) {
      var i, bindings=this.scriptBindings, last=bindings.length, binding;
      for(i=0; i<last; i++) {
        binding = bindings[i];
        if(binding[0]===element) {
          this.head.removeChild(binding[1]);
          bindings.splice(i,1);
          break;
        }
      }
    },

    /**
     * Reload a script's content
     */
    updateScript: function(element, newElement) {
      var i, bindings=this.scriptBindings, last=bindings.length, binding;
      for(i=0; i<last; i++) {
        binding = bindings[i];
        if(binding[0]===element) {
          bindings.splice(i,1);
          break; }}
      this.addScript(newElement);
    },

    /**
     * Scan for javascript <script> elements,
     * and add each to the <head> for execution.
     */
    scanForScripts: function() {
      var _ = this.document.getElementsByTagName("script"),
          elements = snapshot(_),
          e, last = elements.length, element, type;
      for(e=0; e<last; e++) {
        element = elements[e];
        type = element.getAttribute("type");
        if(!type || type.toLowerCase() === "text/javascript") {
          this.addScript(element);
        }
      }
    },

    /**
     * Run a JavaScript function, but using
     * this.window as execution context.
     */
    runJavaScript: function(func) {
      func(this.window);
    }
  };

  // bind as a window-level thing
  window.Frame = Frame;
}());