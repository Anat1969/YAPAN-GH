// ============================================================
// components.js — tiny DOM helpers shared by every screen
// (no framework; plain DOM, file:// safe)
// ============================================================
window.C = (function () {

  // el('div.card', {id:'x'}, [child, 'text'])  — tag supports .class and #id shorthand
  function el(spec, attrs, children) {
    let tag = 'div', id = null, cls = [];
    spec.split(/(?=[.#])/).forEach(function (part, i) {
      if (part[0] === '.') cls.push(part.slice(1));
      else if (part[0] === '#') id = part.slice(1);
      else if (i === 0) tag = part;
    });
    const node = document.createElement(tag);
    if (id) node.id = id;
    if (cls.length) node.className = cls.join(' ');
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') node.className = (node.className ? node.className + ' ' : '') + attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'on' && typeof attrs[k] === 'object') {
          for (const ev in attrs[k]) node.addEventListener(ev, attrs[k][ev]);
        } else if (k === 'dataset') {
          for (const d in attrs[k]) node.dataset[d] = attrs[k][d];
        } else if (attrs[k] != null && attrs[k] !== false) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    append(node, children);
    return node;
  }

  function append(node, children) {
    if (children == null) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === 'string' || typeof c === 'number'
        ? document.createTextNode(String(c)) : c);
    });
  }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  // ¥ formatting (input is JPY integer)
  function yen(n) {
    n = Number(n) || 0;
    return '¥' + n.toLocaleString('en-US');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { el: el, append: append, clear: clear, yen: yen, esc: esc };
})();
