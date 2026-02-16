// ==UserScript==
// @name         MP4/WEBM helper: volume, loop, alt-click save
// @namespace    mp4-webm-helper
// @version      1.5
// @license      MIT
// @description  Remember volume, loop and fast save video without save dialog with Alt+Click
// @match        *://*/*.mp4*
// @match        *://*/*.webm*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==
 
(function () {
    'use strict';
 
    /* ===== SETTINGS ===== */
    const STEP = 0.01;          // volume step 1%
    const DEFAULT_VOLUME = 0.05; // 10%
 
    /* ===== SAVED VALUES ===== */
    let savedVolume = GM_getValue('videoVolume', DEFAULT_VOLUME);
    let savedLoop   = GM_getValue('videoLoop', false);
 
    function showOverlay(text) {
        const box = document.createElement('div');
        box.textContent = text;
        Object.assign(box.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '6px 10px',
            background: 'rgba(0,0,0,.7)',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '6px',
            zIndex: 99999,
            pointerEvents: 'none'
        });
        document.body.appendChild(box);
        setTimeout(() => box.remove(), 900);
    }
 
    function applySettings(video) {
        video.volume = savedVolume;
        video.loop   = savedLoop;
        video.muted  = false;
    }
 
    function saveVideo(video) {
        const url = video.currentSrc || location.href;
        const a = document.createElement('a');
        a.href = url;
        a.download = url.split('/').pop().split('?')[0] || 'video';
        document.body.appendChild(a);
        a.click();
        a.remove();
        showOverlay('💾 Video Saved');
    }
 
    function init(video) {
        applySettings(video);
 
        /* 🎚️ Shift + Scroll → Volume */
        window.addEventListener('wheel', e => {
            if (!e.shiftKey) return;
 
            e.preventDefault();
 
            savedVolume += e.deltaY < 0 ? STEP : -STEP;
            savedVolume = Math.max(0, Math.min(1, savedVolume));
 
            GM_setValue('videoVolume', savedVolume);
            video.volume = savedVolume;
            video.muted = false;
 
            showOverlay(`🔊 ${Math.round(savedVolume * 100)}%`);
        }, { passive: false });
 
        /* 🔁 Saving loop (RMB → Loop) */
        const loopObserver = new MutationObserver(() => {
            if (video.loop !== savedLoop) {
                savedLoop = video.loop;
                GM_setValue('videoLoop', savedLoop);
                showOverlay(savedLoop ? '🔁 Loop: ON' : '▶️ Loop: OFF');
            }
        });
 
        loopObserver.observe(video, {
            attributes: true,
            attributeFilter: ['loop']
        });
 
        /* 💾 Alt + click on video → Save */
        video.addEventListener('click', e => {
            if (!e.altKey) return;
 
            e.preventDefault();
            e.stopPropagation();
 
            saveVideo(video);
        }, true);
    }
 
    /* ===== WAITING FOR VIDEO ===== */
    const observer = new MutationObserver(() => {
        const video = document.querySelector('video');
        if (video) {
            init(video);
            observer.disconnect();
        }
    });
 
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
