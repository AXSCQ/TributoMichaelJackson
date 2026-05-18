export class TagDispatcher {
    constructor() {
        this._tagListeners = new Map();
        this._anyTagListeners = [];
    }
    on(tag, fn) {
        if (!this._tagListeners.has(tag)) this._tagListeners.set(tag, []);
        this._tagListeners.get(tag).push(fn);
        return () => {
            const arr = this._tagListeners.get(tag);
            if (arr) { const i = arr.indexOf(fn); if (i !== -1) arr.splice(i, 1); }
        };
    }
    onAny(fn) {
        this._anyTagListeners.push(fn);
        return () => { this._anyTagListeners = this._anyTagListeners.filter(l => l !== fn); };
    }
    dispatch(wordObj) {
        const tags = wordObj.tags;
        if (!tags?.length) return;
        this._anyTagListeners.forEach(fn => { try { fn(wordObj, tags); } catch(e){} });
        tags.forEach(tag => {
            this._tagListeners.get(tag)?.forEach(fn => { try { fn(wordObj, tag); } catch(e){} });
        });
    }
    clear() { this._tagListeners.clear(); this._anyTagListeners = []; }
}
