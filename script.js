(function () {
  function trackEntry(file, title) {
    var label =
      title ||
      file
        .replace(/\.mp3$/i, "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .trim();
    return { src: "audio/" + encodeURIComponent(file), title: label };
  }

  var playlist = [
    trackEntry("And Then is Heard No More.mp3", "And Then is Heard No More"),
    trackEntry("ChesedBattle01.mp3", "Chesed Battle 01"),
    trackEntry("Gone Angels.mp3"),
    trackEntry("Iron Lotus.mp3"),
  ];

  var audio = document.getElementById("musicEngine");
  var titleEl = document.getElementById("musicTitle");
  var btnPlay = document.getElementById("musicPlay");
  var btnPrev = document.getElementById("musicPrev");
  var btnNext = document.getElementById("musicNext");
  var volInput = document.getElementById("musicVol");
  var seekInput = document.getElementById("musicSeek");
  var timeCurrentEl = document.getElementById("musicTimeCurrent");
  var timeTotalEl = document.getElementById("musicTimeTotal");
  var splash = document.getElementById("splash");
  var splashStars = document.getElementById("splashStars");
  var siteWrap = document.getElementById("siteWrap");
  var skipLink = document.getElementById("skipLink");

  if (!audio || !playlist.length) {
    return;
  }

  var DEFAULT_VOLUME = 0.5;
  volInput.value = String(DEFAULT_VOLUME);

  var idx = Math.floor(Math.random() * playlist.length);
  var entered = false;
  var duckingForVideo = false;
  var musicMutedBeforeDuck = false;
  var seekDragging = false;

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) {
      return "0:00";
    }
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function updateSeekUi() {
    if (!seekInput || !timeCurrentEl || !timeTotalEl) {
      return;
    }
    var d = audio.duration;
    timeCurrentEl.textContent = formatTime(audio.currentTime);
    timeTotalEl.textContent = isFinite(d) ? formatTime(d) : "0:00";
    if (!seekDragging && isFinite(d) && d > 0) {
      var pct = (audio.currentTime / d) * 100;
      seekInput.value = String(pct);
      seekInput.setAttribute("aria-valuenow", String(Math.round(pct)));
    }
  }

  function resetSeekUi() {
    if (!seekInput || !timeCurrentEl || !timeTotalEl) {
      return;
    }
    seekInput.value = "0";
    seekInput.setAttribute("aria-valuenow", "0");
    timeCurrentEl.textContent = "0:00";
    timeTotalEl.textContent = "0:00";
  }

  function anyShowcaseVideoPlaying() {
    var list = document.querySelectorAll("#work video");
    var i;
    for (i = 0; i < list.length; i++) {
      if (!list[i].paused) {
        return true;
      }
    }
    return false;
  }

  function syncMusicDuck() {
    if (anyShowcaseVideoPlaying()) {
      if (!duckingForVideo) {
        musicMutedBeforeDuck = audio.muted;
        duckingForVideo = true;
      }
      audio.muted = true;
    } else if (duckingForVideo) {
      audio.muted = musicMutedBeforeDuck;
      duckingForVideo = false;
    }
  }

  function exitFullscreenIfThisVideo(videoEl) {
    var fs =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement;
    if (!fs || fs !== videoEl) {
      return;
    }
    var doc = document;
    var exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (exit) {
      exit.call(doc).catch(function () {});
    }
  }

  function fillStars() {
    if (!splashStars) {
      return;
    }
    var frag = document.createDocumentFragment();
    var i;
    var s;
    var n;
    for (i = 0; i < 160; i++) {
      s = document.createElement("span");
      s.className = "splash-star";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      n = Math.random();
      s.style.width = s.style.height = (n < 0.55 ? 1 : 2) + "px";
      s.style.opacity = String(0.35 + Math.random() * 0.65);
      s.style.setProperty("--tw", 2 + Math.random() * 4 + "s");
      s.style.setProperty("--td", Math.random() * 5 + "s");
      frag.appendChild(s);
    }
    splashStars.appendChild(frag);
  }

  function reflectVolumeUi() {
    var v = Math.round(audio.volume * 100);
    volInput.setAttribute("aria-valuetext", v + "%");
  }

  function updatePlayButton() {
    var playing = !audio.paused;
    btnPlay.textContent = playing ? "❚❚" : "▶";
    btnPlay.setAttribute("aria-label", playing ? "Pause" : "Play");
  }

  function applyTrack() {
    var item = playlist[idx];
    titleEl.textContent = item.title;
    audio.src = item.src;
    audio.volume = parseFloat(volInput.value);
    reflectVolumeUi();
    syncMusicDuck();
    resetSeekUi();
  }

  function playCurrent() {
    var p = audio.play();
    if (p && typeof p.then === "function") {
      p.then(updatePlayButton).catch(updatePlayButton);
    } else {
      updatePlayButton();
    }
  }

  function step(delta) {
    idx = (idx + delta + playlist.length) % playlist.length;
    applyTrack();
    playCurrent();
  }

  function enterSite() {
    if (entered) {
      return;
    }
    entered = true;
    document.body.classList.add("splash-done");
    if (splash) {
      splash.classList.add("splash--hidden");
      splash.setAttribute("aria-hidden", "true");
    }
    if (siteWrap) {
      siteWrap.removeAttribute("inert");
    }
    playCurrent();
    audio.addEventListener(
      "canplay",
      function () {
        if (audio.paused) {
          playCurrent();
        }
      },
      { once: true }
    );
  }

  fillStars();
  applyTrack();

  if (splash) {
    splash.addEventListener("click", enterSite);
    splash.addEventListener("keydown", function (e) {
      if (e.key === " ") {
        e.preventDefault();
        enterSite();
      }
    });
  }

  if (skipLink) {
    skipLink.addEventListener("click", function (e) {
      if (!document.body.classList.contains("splash-done")) {
        e.preventDefault();
        enterSite();
        var main = document.getElementById("main");
        if (main) {
          main.focus({ preventScroll: true });
        }
      }
    });
  }

  audio.addEventListener("ended", function () {
    step(1);
  });

  audio.addEventListener("play", updatePlayButton);
  audio.addEventListener("pause", updatePlayButton);

  btnPlay.addEventListener("click", function () {
    if (audio.paused) {
      playCurrent();
    } else {
      audio.pause();
      updatePlayButton();
    }
  });

  btnPrev.addEventListener("click", function () {
    step(-1);
  });

  btnNext.addEventListener("click", function () {
    step(1);
  });

  volInput.addEventListener("input", function () {
    audio.volume = parseFloat(volInput.value);
    reflectVolumeUi();
  });

  if (seekInput) {
    seekInput.addEventListener("pointerdown", function () {
      seekDragging = true;
    });
    seekInput.addEventListener("pointerup", function () {
      seekDragging = false;
      updateSeekUi();
    });
    seekInput.addEventListener("pointercancel", function () {
      seekDragging = false;
      updateSeekUi();
    });
    seekInput.addEventListener("input", function () {
      var d = audio.duration;
      if (!isFinite(d) || d <= 0) {
        return;
      }
      audio.currentTime = (parseFloat(seekInput.value) / 100) * d;
    });
  }

  audio.addEventListener("timeupdate", updateSeekUi);
  audio.addEventListener("loadedmetadata", updateSeekUi);
  audio.addEventListener("durationchange", updateSeekUi);

  document.querySelectorAll("#work video").forEach(function (video) {
    video.addEventListener("play", syncMusicDuck);
    video.addEventListener("pause", syncMusicDuck);
    video.addEventListener("ended", function () {
      exitFullscreenIfThisVideo(video);
      syncMusicDuck();
    });
  });
})();
