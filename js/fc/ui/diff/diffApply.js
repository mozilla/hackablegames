/**
 * find and apply source code -> frame DOM diff
 */
function diffApply(d1, d2, frame)
{
  // find diffs. Then apply them.
  var routes = DOMdiff.getDiff(d1,d2), route, iroute,
      d, lastRoute = routes.length, v,
      log = "";

  // If nothing changed, don't bother with the rest
  // of the code. It won't do anything =)
  if(lastRoute===1 && routes[0]===0) { return false; }

  // If we do have change routes, apply them.
  for(d = 0; d < lastRoute; d++)
  {
    // shortcut
    if (routes[d] === 0) { continue; }

    // rewrite so we do can resolve the top-level diff
    if (routes[d] === -1) { routes[d] = [-1]; }

    // follow the route to the elements
    route = arrayCopy(routes[d]),
    iroute = arrayCopy(routes[d]);
    var diffRoute = "difference route: " + route,
        e1 = d1, e2 = d2,
        e = route.splice(0,1)[0];
    while (e !== -1) {
      e1 = e1.childNodes[e];
      e2 = e2.childNodes[e];
      e = route.splice(0,1)[0]; }

    // text node update? simples!
    if(e1.nodeType===3 && e2.nodeType===3) {
      log += diffRoute + "\n" +
                         "e1: " + (e1? serialise(e1) : "<missing>") + "\n" +
                         "e2: " + (e2? serialise(e2) : "<missing>") + "\n" +
                         "\n";

      var element = frame.find(iroute),
          parent = element.parentNode;
      parent.replaceChild(e1,element);

      // TEST HACK - text in a script element?
      //
      if(parent.nodeName==="SCRIPT")
      {

        // JavaScript element: update the element mirror
        if (!parent.getAttribute("type") || parent.getAttribute("type") === "text/javascript")
        {
          frame.updateScript(e2.parentNode, e1.parentNode);
        }

        // Not JavaScript: if it has an onchange attribute, run its code:
        else if (parent.getAttribute("onchange")) {
          var call = parent.getAttribute("onchange"),
              fbody = "function(context) { with(context) { "+call+"; }}";
          var func = (new Function("fragment", "return "+fbody+";")(parent));
          frame.runJavaScript(func);
        }

        // or, if it has an onchange handler, wrap-call that:
        else if (parent.onchange) {
          frame.runJavaScript(parent.onchange);
        }

      }
      //
      // TEST HACK

    }

    // childnode diff... Not so simple.
    else {
      var complexDiff = DOMdiff.innerEquality(e1,e2),
          pos, last, entry;

      log += "complex " + diffRoute + "\n";

      // check for attribute differences
      var outerDiff = DOMdiff.outerEquality(e1,e2);
      if(outerDiff.length>0) {
        log += "  outerHTML changes: \n";
        last = outerDiff.length;
        for(pos=0; pos<last; pos++) {
          entry = outerDiff[pos];

          if(entry[0]==="nodeName") {
            log += "    tag name difference. left: '"+entry[1]+"', right: '"+entry[2]+"'\n";

            var element = frame.find(iroute),
                newElement = document.createElement(entry[1]);
            // copy children over
            while(element.childNodes.length>0) {
              newElement.appendChild(element.childNodes[0]);
            }
            // copy element attributes over
            newElement.attributes = element.attributes;
            // and replace!
            element.parentNode.replaceChild(newElement, element);
          }

          else {
            log += "    attribute: '"+entry[0]+"', left: '"+entry[1]+"', right: '"+entry[2]+"'\n";

            var element = frame.find(iroute);
            if(entry[1]==null) { element.removeAttribute(entry[0]); }
            else { element.setAttribute(entry[0], entry[1]); }
            if (element.onchange) {
              frame.runJavaScript(element.onchange);
            }
          }
        }
      }

      // Shortcut on "no complex diffs found". This
      // basically implies we did find an outer diff.
      if(!complexDiff) {
        log += "\n";
        continue;
      }

      // check for node removals
      last = complexDiff.removals.length;
      if(last>0) {
        log += "  removals: \n";
        // NOTE: remove elements from tail to head
        for(pos=last-1; pos>=0; pos--) {
          entry = complexDiff.removals[pos];
          log += "    right["+entry[0]+"] ("+serialise(entry[1])+")\n";

          var element = frame.find(iroute).childNodes[entry[0]],
              parent = element.parentNode;
          parent.removeChild(element);

          // TEST HACK - remove script from frame head
          //
          if(entry[1].nodeName==="SCRIPT" && (!entry[1].type || entry[1].type==="text/javascript"))
          {
            frame.removeScript(element);
          }
          //
          // TEST HACK

          // update the relocations, because by removing X,
          // any relocation of the type left[a]->right[b]
          // where b is X or higher, should now be
          // left[a] -> right[b-1] -- Note that the following
          // code is POC, and still needs cleaning up.

          // FIXME: clean up this code
          for(var i=0; i<complexDiff.relocations.length; i++) {
            var relocation = complexDiff.relocations[i];
            if(relocation[1] >= entry[0]) {
              relocation[1]--;
            }
          }
        }
      }

      // check for node insertions
      last = complexDiff.insertions.length;
      if(last>0) {
        log += "  insertions: \n";
        // NOTE: insert elements from head to tail
        for(pos=0; pos<last; pos++) {
          entry = complexDiff.insertions[pos];
          log += "    left["+entry[0]+"] ("+serialise(entry[1])+")\n";

          var element = frame.find(iroute);
          if(entry[0] >= element.childNodes.length) { element.appendChild(entry[1]); }
          else { element.insertBefore(entry[1], element.childNodes[entry[0]]); }

          // TEST HACK - add scripts to frame head, so it'll actually
          //             do something
          if(entry[1].nodeName==="SCRIPT")
          {
            if(!entry[1].type || entry[1].type==="text/javascript")
            {
              frame.addScript(entry[1]);
            }
          }
          //
          // TEST HACK


          // update the relocations, because by inserting X,
          // any relocation of the type left[a]->right[b]
          // where b is X or higher, should now be
          // left[a] -> right[b+1] -- Note that the following
          // code is POC, and still needs cleaning up.

          // FIXME: clean up this code
          for(var i=0; i<complexDiff.relocations.length; i++) {
            var relocation = complexDiff.relocations[i];
            if(relocation[1] >= entry[0]) {
              relocation[1]++;
            }
          }
        }
      }

      // preform just-moved-around updates
      last = complexDiff.relocations.length;
      if(last>0) {
        log += "  relocations: \n";

        var element, nodes, nlen,
            child, next,
            oldPos, newPos;

        // NOTE: relocate elements from tail to head
        for(pos=last-1; pos>=0; pos--) {
          element = frame.find(iroute);
          nodes = element.childNodes;
          entry = complexDiff.relocations[pos];
          log += "    left["+entry[0]+"] <-> right["+entry[1]+"]\n";// ("+serialise(nodes[entry[1]])+")\n";

          // IFRAME UPDATING
          /*
          if(false) {
            // NOTE: we don't update based on relocations,
            //       because DOMdiff currently has problems
            //       with determining relocation. Fix this!
            nlen = nodes.length;
            oldPos = entry[1];
            child = element.childNodes[oldPos];
            newPos = entry[0];
            next = (newPos<nlen ? element.childNodes[newPos] : child);

            // end of the list relocation
            if(child===next) {
              element.appendChild(child);
            }

            // mid-list relocation
            else {
              element.insertBefore(child, next);
            }
          }
          */
          // IFRAME UPDATING
        }
      }

      log += "\n";
    }
  }
  return log;
}