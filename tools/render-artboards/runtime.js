/* Stand-in for the canvas runtime (support.js) that is missing from the handoff.
   Evaluates an artboard's DCLogic.renderVals() and fills its {{…}}, <sc-for>, <sc-if> template. */
(function () {
  "use strict";

  var EXPR = /\{\{\s*([^}]+?)\s*\}\}/g;

  function resolvePath(path, scope) {
    return path
      .trim()
      .split(".")
      .reduce(function (acc, key) {
        return acc == null ? undefined : acc[key];
      }, scope);
  }

  function interpolate(text, scope) {
    return text.replace(EXPR, function (_, p) {
      var v = resolvePath(p, scope);
      return v == null ? "" : String(v);
    });
  }

  function exprOf(attr) {
    if (attr == null) return null;
    var m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(attr);
    return m ? m[1] : null;
  }

  function literal(attr) {
    var e = exprOf(attr);
    if (e === null) return undefined;
    if (e === "true") return true;
    if (e === "false") return false;
    if (/^-?\d+(\.\d+)?$/.test(e)) return Number(e);
    return undefined;
  }

  function renderChildren(parent, scope) {
    Array.prototype.slice.call(parent.childNodes).forEach(function (n) {
      renderNode(n, scope);
    });
  }

  function expand(el, scope) {
    var holder = el.ownerDocument.createElement("div");
    Array.prototype.slice.call(el.childNodes).forEach(function (c) {
      holder.appendChild(c.cloneNode(true));
    });
    renderChildren(holder, scope);
    return Array.prototype.slice.call(holder.childNodes);
  }

  function renderNode(node, scope) {
    if (node.nodeType === 3) {
      node.textContent = interpolate(node.textContent || "", scope);
      return;
    }
    if (node.nodeType !== 1) return;
    var el = node;
    var tag = el.tagName.toLowerCase();

    if (tag === "sc-for") {
      var listExpr = exprOf(el.getAttribute("list"));
      var as = el.getAttribute("as") || "item";
      var list = listExpr ? resolvePath(listExpr, scope) : undefined;
      if (!Array.isArray(list)) {
        var count = Number(el.getAttribute("hint-placeholder-count") || 0);
        list = Array.apply(null, Array(count)).map(function () {
          return {};
        });
      }
      var out = [];
      list.forEach(function (item) {
        var child = Object.assign({}, scope);
        child[as] = item;
        out = out.concat(expand(el, child));
      });
      el.replaceWith.apply(el, out);
      return;
    }

    if (tag === "sc-if") {
      var e = exprOf(el.getAttribute("value"));
      var v = e ? resolvePath(e, scope) : undefined;
      if (v === undefined) v = literal(el.getAttribute("hint-placeholder-val"));
      if (v) el.replaceWith.apply(el, expand(el, scope));
      else el.remove();
      return;
    }

    Array.prototype.slice.call(el.attributes).forEach(function (a) {
      if (a.value.indexOf("{{") === -1) return;
      if (/^on/i.test(a.name)) el.removeAttribute(a.name);
      else el.setAttribute(a.name, interpolate(a.value, scope));
    });
    renderChildren(el, scope);
  }

  function renderTemplate(root, scope) {
    renderChildren(root, scope);
  }

  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === "function" ? patch(this.state) : patch;
    this.state = Object.assign({}, this.state, next);
  };

  function boot() {
    var host = document.querySelector("x-dc");
    if (!host) return;
    var scriptEl = document.querySelector('script[type="text/x-dc"]');
    var vals = {};
    if (scriptEl) {
      var Component = new Function("DCLogic", scriptEl.textContent + "\n;return Component;")(
        DCLogic,
      );
      var props = JSON.parse(scriptEl.getAttribute("data-props") || "{}");
      var inst = new Component(props);
      if (typeof inst.componentDidMount === "function") {
        try {
          inst.componentDidMount();
        } catch (err) {
          console.warn("componentDidMount failed", err);
        }
      }
      vals = typeof inst.renderVals === "function" ? inst.renderVals() : {};
    }
    var helmet = host.querySelector("helmet");
    if (helmet) {
      Array.prototype.slice.call(helmet.children).forEach(function (c) {
        document.head.appendChild(c);
      });
      helmet.remove();
    }
    renderTemplate(host, vals);
    host.replaceWith.apply(host, Array.prototype.slice.call(host.childNodes));
    document.documentElement.setAttribute("data-dc-ready", "true");
  }

  window.__dcTemplate = {
    resolvePath: resolvePath,
    interpolate: interpolate,
    renderTemplate: renderTemplate,
    DCLogic: DCLogic,
    boot: boot,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (document.querySelector("x-dc")) boot();
    });
  } else if (document.querySelector("x-dc")) {
    boot();
  }
})();
