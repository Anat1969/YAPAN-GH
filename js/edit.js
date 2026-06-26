// ============================================================
//  edit.js — פעולות עריכה. הכל עובר דרך App.store.update(delta)
//  כך כל שינוי נשמר ומשודר אוטומטית לכל המסכים.
// ============================================================
window.App = window.App || {};
App.edit = (function () {

  const S = function () { return App.store; };

  // עדכון שדה בודד בפריט
  function setField(itemId, field, value) {
    const patch = {}; patch[field] = value;
    S().update({ items: { [itemId]: patch } });
  }

  function setPriority(itemId, priority) { setField(itemId, 'priority', priority); }
  function setStatus(itemId, status) { setField(itemId, 'status', status); }
  function setText(itemId, field, value) { setField(itemId, field, value); }
  function setPeople(itemId, people) { setField(itemId, 'people', people); }
  function setCoordinates(itemId, lat, lng) { setField(itemId, 'coordinates', { lat, lng }); }

  // יום: עריכת שדה (תאריך, כותרת, לינה...)
  function setDayField(dayId, field, value) {
    const patch = {}; patch[field] = value;
    S().update({ days: { [dayId]: patch } });
  }

  // הוספת פריט חדש
  function addItem(over) {
    const id = 'user-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const item = App.normalize.makeItem(Object.assign({ id, status: 'proposed' }, over || {}));
    const delta = { items: { [id]: item } };
    S().update(delta);
    // שיוך ליום אם צוין
    if (over && over.dayId) {
      const day = S().getDay(over.dayId);
      if (day) {
        const order = (day.itemOrder || []).slice();
        order.push(id);
        S().update({ days: { [over.dayId]: { itemOrder: order } } });
      }
    }
    return id;
  }

  // מחיקת פריט
  function deleteItem(itemId) { S().update({ deleted: [itemId] }); }

  // העברת פריט מיום ליום
  function moveItemToDay(itemId, fromDayId, toDayId, atIndex) {
    const st = S().get();
    const from = st.days[fromDayId], to = st.days[toDayId];
    const days = {};
    if (from && from.itemOrder) {
      days[fromDayId] = { itemOrder: from.itemOrder.filter(x => x !== itemId) };
    }
    if (to) {
      const order = (to.itemOrder || []).filter(x => x !== itemId);
      if (atIndex == null || atIndex < 0) order.push(itemId);
      else order.splice(atIndex, 0, itemId);
      days[toDayId] = { itemOrder: order };
    }
    S().update({ items: { [itemId]: { dayId: toDayId } }, days });
  }

  // סידור מחדש בתוך יום (העברת פריט מ-index ל-index)
  function reorderInDay(dayId, fromIdx, toIdx) {
    const day = S().getDay(dayId);
    if (!day) return;
    const order = day.itemOrder.slice();
    const [moved] = order.splice(fromIdx, 1);
    order.splice(toIdx, 0, moved);
    S().update({ days: { [dayId]: { itemOrder: order } } });
  }

  // סידור מחדש של ימים
  function reorderDays(newOrder) { S().update({ dayOrder: newOrder }); }

  // החלפת מלון ליום
  function setDayHotel(dayId, hotelItemId) { setDayField(dayId, 'sleepRef', hotelItemId); }

  // עדכון עלות/כמות (נשמר ב-meta)
  function setCost(itemId, cost, qty) {
    const item = S().getItem(itemId);
    const meta = Object.assign({}, item.meta || {});
    if (cost != null) meta.cost = Number(cost) || 0;
    if (qty != null) meta.qty = Number(qty) || 1;
    setField(itemId, 'meta', meta);
  }

  // הוספת רשומת עלות חדשה בקטגוריה
  function addCost(category, over) {
    return addItem(Object.assign({
      nameHe: 'עלות חדשה', type: 'cost', status: 'proposed',
      meta: { cost: 0, qty: 1, costCat: category, costSource: 'manual' },
    }, over || {}));
  }

  // ----- meta של הטיול (קונספט, גלריה) -----
  function setMeta(key, value) {
    const patch = {}; patch[key] = value;
    S().update({ tripMeta: patch });
  }
  function addGalleryImage(dataUrl, caption) {
    const gallery = (S().get().meta.gallery || []).slice();
    gallery.push({ src: dataUrl, caption: caption || '' });
    S().update({ tripMeta: { gallery } });
  }
  function removeGalleryImage(idx) {
    const gallery = (S().get().meta.gallery || []).slice();
    gallery.splice(idx, 1);
    S().update({ tripMeta: { gallery } });
  }

  return {
    setField, setPriority, setStatus, setText, setPeople, setCoordinates,
    setDayField, addItem, deleteItem, moveItemToDay, reorderInDay, reorderDays, setDayHotel,
    setCost, addCost, setMeta, addGalleryImage, removeGalleryImage,
  };
})();
