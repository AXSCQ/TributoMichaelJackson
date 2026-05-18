/**
 * WordScheduler — Precision word-level event scheduler.
 * Fires callbacks at the right moment based on currentTime polling.
 * Uses binary-search cursor to avoid O(n) scanning every frame.
 */
export class WordScheduler {
    constructor(config = {}) {
        this._lookahead = config.lookahead ?? 0.08;
        this._overlap   = config.overlap   ?? 0.05;
        this._words     = [];
        this._listeners = new Map();
        this._cursor    = 0;
        this._activeIdx = -1;
        this._lastTime  = -1;
    }

    load(words) {
        this._words = [...words].sort((a, b) => a.start - b.start);
        this.reset();
        return this;
    }

    onWord(fn) {
        this._listeners.set(fn, { fired: new Set() });
        return () => this._listeners.delete(fn);
    }

    update(currentTime) {
        const words = this._words;
        if (!words.length) return null;

        if (currentTime < this._lastTime - 0.5) {
            this._cursor = Math.max(0, this._binarySearch(currentTime) - 1);
            this._activeIdx = -1;
            this._listeners.forEach(state => state.fired.clear());
        }
        this._lastTime = currentTime;

        let newActive = null;

        for (let i = this._cursor; i < words.length; i++) {
            const w = words[i];
            if (currentTime > w.end + this._overlap) { this._cursor = i + 1; continue; }
            if (currentTime < w.start - this._lookahead) break;

            const isActive = currentTime >= w.start - this._lookahead &&
                             currentTime <= w.end + this._overlap;
            if (isActive) {
                newActive = w;
                this._listeners.forEach((state, fn) => {
                    if (!state.fired.has(i)) {
                        state.fired.add(i);
                        try { fn(w, i); } catch (e) { /* */ }
                    }
                });
                break;
            }
        }

        if (newActive) this._activeIdx = this._words.indexOf(newActive);
        return newActive;
    }

    get activeWord() { return this._activeIdx >= 0 ? this._words[this._activeIdx] : null; }
    get nextWord()   { return this._words[this._activeIdx + 1] ?? null; }

    reset() {
        this._cursor = 0; this._activeIdx = -1; this._lastTime = -1;
        this._listeners.forEach(s => s.fired.clear());
    }

    _binarySearch(time) {
        let lo = 0, hi = this._words.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (this._words[mid].start < time) lo = mid + 1; else hi = mid;
        }
        return Math.max(0, lo - 1);
    }
}
