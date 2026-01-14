/* =========================================================
   D3.1 HOTFIX - Headless Daily CallObject (NO floating UI)
   Goal: restore inline video rendering reliably.
   Exposes:
     window.dailyVideo.joinRoom(roomUrl, userName, permissions)
     window.dailyVideo.updatePermissions(permissions)
     window.dailyVideo.leave()
     window.dailyVideo.destroy()
     window.dailyVideo.callObject  (Daily call object)
========================================================= */
(function () {
  "use strict";

  class DailyVideoManager {
    constructor() {
      this.callObject = null;
      this.joined = false;
      this.allowed = { video: true, audio: true };
      this.userPref = { video: null, audio: null }; // user toggles (future use)
      this._scriptPromise = null;
    }

    async loadDailyScript() {
      if (window.Daily) return;
      if (this._scriptPromise) return this._scriptPromise;
      this._scriptPromise = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://unpkg.com/@daily-co/daily-js";
        s.async = true;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
      });
      return this._scriptPromise;
    }

    async ensureCallObject() {
      await this.loadDailyScript();
      if (!this.callObject) {
        this.callObject = window.Daily.createCallObject();
      }
      return this.callObject;
    }

    async joinRoom(roomUrl, userName, permissions = { video: true, audio: true }) {
      this.allowed = { ...permissions };
      await this.ensureCallObject();

      const startVideoOff = !permissions.video;
      const startAudioOff = !permissions.audio;

      // If already joined, do nothing (video-integration-client may call twice)
      if (this.joined) return;

      await this.callObject.join({
        url: roomUrl,
        userName,
        startVideoOff,
        startAudioOff
      });

      this.joined = true;

      // Enforce permissions after join (guard against user toggles)
      await this.applyPermissions();
    }

    async applyPermissions() {
      if (!this.callObject || !this.joined) return;

      const wantVideo = this.userPref.video !== null ? this.userPref.video : this.allowed.video;
      const wantAudio = this.userPref.audio !== null ? this.userPref.audio : this.allowed.audio;

      try { await this.callObject.setLocalVideo(!!wantVideo); } catch {}
      try { await this.callObject.setLocalAudio(!!wantAudio); } catch {}
    }

    async updatePermissions(permissions = { video: true, audio: true }) {
      this.allowed = { ...permissions };
      await this.applyPermissions();
    }

    async leave() {
      if (!this.callObject) return;
      try { await this.callObject.leave(); } catch {}
      this.joined = false;
    }

    async destroy() {
      if (!this.callObject) return;
      try { await this.callObject.destroy(); } catch {}
      this.callObject = null;
      this.joined = false;
    }
  }

  window.dailyVideo = new DailyVideoManager();
  console.log("[DailyUI] dailyVideo manager ready ✅ v5.3-callobject");
})();
