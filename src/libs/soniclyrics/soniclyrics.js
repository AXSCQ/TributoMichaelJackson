/**
 * SonicLyrics — runtime (embedded version, no npm install needed).
 * Word-level lyrics synchronization integrated with SonicMotion.
 */
import { WordScheduler } from './word-scheduler.js';
import { LineTracker }   from './line-tracker.js';
import { TagDispatcher } from './tag-dispatcher.js';

class SonicLyricsInstance {
    constructor(config = {}) {
        this._sonic    = config.sonic  ?? null;
        this._audio    = config.audio  ?? null;
        this._lookahead= config.lookahead ?? 0.08;

        this._scheduler   = new WordScheduler({ lookahead: this._lookahead });
        this._lineTracker = new LineTracker();
        this._tagDispatch = new TagDispatcher();

        this._loaded   = false;
        this._running  = false;
        this._rafId    = null;
        this._lyricsData = null;
        this._phrases    = [];
        this._activePhraseIds = new Set();

        this._wordQueue  = [];
        this._lineQueue  = [];
        this._phraseListeners = new Map();

        if (config.src) this._loadSource(config.src);
    }

    // ── Public API ─────────────────────────────────────────────────────────

    async load(src) { await this._loadSource(src); return this; }

    onWord(fn) {
        if (!this._loaded) {
            this._wordQueue.push(fn);
            return () => { this._wordQueue = this._wordQueue.filter(f => f !== fn); };
        }
        return this._scheduler.onWord((word, idx) => {
            this._tagDispatch.dispatch(word);
            fn(word, idx);
        });
    }

    onLine(fn) {
        if (!this._loaded) {
            this._lineQueue.push(fn);
            return () => { this._lineQueue = this._lineQueue.filter(f => f !== fn); };
        }
        return this._lineTracker.onLine(fn);
    }

    onTag(tag, fn) { return this._tagDispatch.on(tag, fn); }

    onAnyTag(fn) { return this._tagDispatch.onAny(fn); }

    onPhrase(phraseId, fn) {
        if (!this._phraseListeners.has(phraseId)) this._phraseListeners.set(phraseId, []);
        this._phraseListeners.get(phraseId).push(fn);
        return () => {
            const arr = this._phraseListeners.get(phraseId);
            if (arr) { const i = arr.indexOf(fn); if (i !== -1) arr.splice(i, 1); }
        };
    }

    start() {
        if (this._running) return this;
        this._running = true;
        this._loop();
        return this;
    }

    stop() {
        this._running = false;
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
        return this;
    }

    seek() {
        this._scheduler.reset();
        this._lineTracker.reset();
        this._activePhraseIds = new Set();
    }

    get currentWord()    { return this._scheduler.activeWord; }
    get currentLine()    { return this._lineTracker.activeLine; }
    get lineProgress()   { return this._lineTracker.lineProgress(this._currentTime ?? 0); }
    get data()           { return this._lyricsData; }

    destroy() {
        this.stop();
        this._tagDispatch.clear();
        this._phraseListeners.clear();
    }

    // ── Internal ───────────────────────────────────────────────────────────

    async _loadSource(src) {
        let data;
        if (typeof src === 'string') {
            const res = await fetch(src);
            if (!res.ok) throw new Error(`SonicLyrics: Failed to load "${src}"`);
            data = await res.json();
        } else {
            data = src;
        }

        this._lyricsData = data;
        this._scheduler.load(data.words ?? []);
        this._lineTracker.load(data.lines ?? []);
        this._phrases = data.phrases ?? [];
        this._activePhraseIds = new Set();
        this._loaded = true;

        // Flush queued callbacks
        const wq = [...this._wordQueue]; this._wordQueue = [];
        wq.forEach(fn => this.onWord(fn));
        const lq = [...this._lineQueue]; this._lineQueue = [];
        lq.forEach(fn => this.onLine(fn));

        if (this._sonic || this._audio) this.start();
        return data;
    }

    _loop() {
        if (!this._running) return;
        const t = this._getTime();
        this._currentTime = t;

        if (t >= 0) {
            this._scheduler.update(t);
            this._lineTracker.update(t);
            this._trackPhrases(t);
        }

        this._rafId = requestAnimationFrame(() => this._loop());
    }

    _getTime() {
        if (this._sonic && typeof this._sonic.currentTime === 'number') return this._sonic.currentTime;
        if (this._audio) return this._audio.currentTime;
        return -1;
    }

    _trackPhrases(t) {
        for (const phrase of this._phrases) {
            const wasActive = this._activePhraseIds.has(phrase.id);
            const isActive  = t >= phrase.start && t <= phrase.end;
            if (isActive && !wasActive) {
                this._activePhraseIds.add(phrase.id);
                this._phraseListeners.get(phrase.id)?.forEach(fn => { try { fn(phrase); } catch(e){} });
            } else if (!isActive && wasActive) {
                this._activePhraseIds.delete(phrase.id);
                this._phraseListeners.get(phrase.id)?.forEach(fn => { try { fn(null); } catch(e){} });
            }
        }
    }
}

const SonicLyrics = {
    create: (config = {}) => new SonicLyricsInstance(config),
    version: '1.0.0',
};

export default SonicLyrics;
export { SonicLyricsInstance };
