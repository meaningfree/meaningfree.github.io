/**
 * スマホ向け入力:
 * - 1本指ドラッグ: パン（panツール時）/ 建設ドラッグ（線系ツール）
 * - タップ: 建設 or 調査
 * - ピンチ: ズーム
 * - マウス: 同等
 */
export class Input {
  constructor(canvas, hooks) {
    this.canvas = canvas;
    this.hooks = hooks; // { onTap, onDragBuild, onPan, onZoom, onHover, getTool }
    this.pointers = new Map();
    this.dragging = false;
    this.panning = false;
    this.buildDragging = false;
    this.lastBuildKey = null;
    this.pinchStartDist = 0;
    this.pinchStartZoom = 1;
    this.moved = false;
    this.startX = 0;
    this.startY = 0;

    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  rect() {
    return this.canvas.getBoundingClientRect();
  }

  pos(e) {
    const r = this.rect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  onDown = (e) => {
    this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: this.pos(e).x, sy: this.pos(e).y });
    this.moved = false;
    this.startX = e.clientX;
    this.startY = e.clientY;

    if (this.pointers.size === 2) {
      const pts = [...this.pointers.values()];
      this.pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      this.pinchStartZoom = this.hooks.getZoom();
      this.panning = false;
      this.buildDragging = false;
      return;
    }

    const tool = this.hooks.getTool();
    const p = this.pos(e);
    if (tool === "pan" || e.button === 1 || e.button === 2) {
      this.panning = true;
    } else if (tool !== "inspect" && tool !== "pan") {
      this.buildDragging = true;
      this.lastBuildKey = null;
      this.hooks.onDragBuild(p.x, p.y, true);
    }
  };

  onMove = (e) => {
    if (!this.pointers.has(e.pointerId)) {
      // ホバー（デスクトップ）
      const p = this.pos(e);
      this.hooks.onHover?.(p.x, p.y);
      return;
    }
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: this.pos(e).x, sy: this.pos(e).y });

    if (this.pointers.size === 2) {
      const pts = [...this.pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (this.pinchStartDist > 0) {
        const midX = (pts[0].sx + pts[1].sx) / 2;
        const midY = (pts[0].sy + pts[1].sy) / 2;
        const scale = dist / this.pinchStartDist;
        this.hooks.onZoom(this.pinchStartZoom * scale, midX, midY);
      }
      // 2本指パン
      // （簡易: 中点の移動は省略しズーム優先）
      return;
    }

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    if (Math.hypot(dx, dy) > 8) this.moved = true;

    const p = this.pos(e);
    this.hooks.onHover?.(p.x, p.y);

    if (this.panning) {
      const prev = this._lastPan || { x: e.clientX, y: e.clientY };
      this.hooks.onPan(e.clientX - prev.x, e.clientY - prev.y);
      this._lastPan = { x: e.clientX, y: e.clientY };
      return;
    }
    this._lastPan = { x: e.clientX, y: e.clientY };

    // panツール以外でも、移動量が大きい＆建設ツールでない場合はパンに切替… 
    // → 線ツールはドラッグ建設。パンは明示ツール or 2本指。
    if (this.buildDragging) {
      const key = `${Math.floor(p.x)},${Math.floor(p.y)}`;
      // ワールド座標での重複抑制は hooks 側
      this.hooks.onDragBuild(p.x, p.y, false);
    }
  };

  onUp = (e) => {
    const had = this.pointers.has(e.pointerId);
    this.pointers.delete(e.pointerId);

    if (this.pointers.size < 2) {
      this.pinchStartDist = 0;
    }

    if (!had) return;

    if (this.pointers.size === 0) {
      const p = this.pos(e);
      if (!this.moved && !this.panning) {
        this.hooks.onTap(p.x, p.y);
      } else if (this.buildDragging && !this.moved) {
        this.hooks.onTap(p.x, p.y);
      }
      this.panning = false;
      this.buildDragging = false;
      this._lastPan = null;
      this.hooks.onDragEnd?.();
    }
  };

  onWheel = (e) => {
    e.preventDefault();
    const p = this.pos(e);
    const z = this.hooks.getZoom();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this.hooks.onZoom(z * factor, p.x, p.y);
  };
}
