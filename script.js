/* Personaliza únicamente este objeto. El resto de la interfaz toma sus datos de aquí. */
const EVENT = {
  date: new Date("2026-11-07T21:00:00-06:00"),
  guestName: "ALEJANDRO",
  passCount: 2,
  locationName: "HACIENDA BLACKWOOD",
  address: "Av. Ejemplo 666, Ciudad de México",
  whatsappNumber: "5213333394127" // Lada + número, solo dígitos, sin espacios ni el signo +.
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const saveData = navigator.connection?.saveData === true;
const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
let refreshScrollAnimations = () => {};
let startBackgroundMusic = () => Promise.resolve(false);
let resetBackgroundMusic = () => {};

function setEventDetails() {
  const date = EVENT.date;
  const parts = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Mexico_City" }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  const details = {
    weekday: get("weekday").toLocaleUpperCase("es-MX"),
    day: get("day"),
    month: get("month").toLocaleUpperCase("es-MX"),
    time: `${get("hour")}:${get("minute")} HRS`,
    fullDate: `${get("day")} ${get("month").toLocaleUpperCase("es-MX")} ${get("year")}`,
    monthYear: `${get("month").slice(0, 3).toLocaleUpperCase("es-MX")} / ${get("year")}`,
    numericDate: `${get("day")} · ${String(date.getMonth() + 1).padStart(2, "0")} · ${get("year")}`
  };
  Object.entries(details).forEach(([key, value]) => $$(`[data-event="${key}"]`).forEach((node) => { node.textContent = value; }));
  $("#envelopeGuest").textContent = EVENT.guestName;
  $("#guestName").textContent = EVENT.guestName;
  $("#passCount").textContent = String(Math.max(1, EVENT.passCount)).padStart(2, "0");
  $("#locationName").textContent = EVENT.locationName;
  $("#locationAddress").textContent = EVENT.address;
  $("#mapLink").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${EVENT.locationName}, ${EVENT.address}`)}`;
  $("#rsvpName").value = EVENT.guestName.toLocaleLowerCase("es-MX").replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("es-MX"));
  const guestSelect = $("#guestNumber");
  const passes = Math.max(1, Math.min(10, Math.floor(Number(EVENT.passCount) || 1)));
  guestSelect.replaceChildren(...Array.from({ length: passes }, (_, index) => {
    const option = document.createElement("option");
    option.value = String(index + 1);
    option.textContent = `${index + 1} ${index === 0 ? "alma" : "almas"}`;
    return option;
  }));
  guestSelect.value = String(passes);
  document.title = `Halloween Fest · ${details.day}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
  const description = `Halloween Fest · ${details.weekday.toLocaleLowerCase("es-MX")} ${details.day} de ${details.month.toLocaleLowerCase("es-MX")} de ${date.getFullYear()} a las ${details.time}.`;
  $("meta[name='description']").content = description;
  $("meta[property='og:title']").content = document.title;
  $("meta[property='og:description']").content = description;
}

function playGateSound() {
  try {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    const context = new AudioEngine();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    gain.gain.setValueAtTime(.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.18, context.currentTime + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .62);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(160, context.currentTime + .62);
    filter.connect(gain).connect(context.destination);
    [92, 184].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index ? "square" : "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 2.2, context.currentTime + .25);
      oscillator.connect(filter);
      oscillator.start();
      oscillator.stop(context.currentTime + .65);
    });
    window.setTimeout(() => context.close(), 900);
  } catch (_) { /* La apertura sigue funcionando aunque Web Audio no esté disponible. */ }
}

function initInvitationGate() {
  const html = document.documentElement;
  const posterGate = $("#invitationGate");
  const envelopeGate = $("#envelopeGate");
  const site = $("#siteShell");
  const continueButton = $("#continuePoster");
  const envelopeButton = $("#openEnvelope");
  const main = $("#mainContent");
  const skipLink = $("#skipLink");
  let stage = "";
  let stageTimer = 0;

  const setStage = (nextStage, moveFocus = false) => {
    stage = nextStage;
    window.clearTimeout(stageTimer);
    html.classList.remove("poster-visible", "envelope-visible", "envelope-opening", "invitation-opened");
    html.classList.add(nextStage);
    posterGate.classList.remove("poster-fading");

    const posterActive = nextStage === "poster-visible";
    const envelopeActive = nextStage === "envelope-visible" || nextStage === "envelope-opening";
    const opened = nextStage === "invitation-opened";

    posterGate.setAttribute("aria-hidden", String(!posterActive));
    posterGate.inert = !posterActive;
    envelopeGate.setAttribute("aria-hidden", String(!envelopeActive));
    envelopeGate.inert = !envelopeActive;
    site.setAttribute("aria-hidden", String(!opened));
    site.inert = !opened;
    skipLink.setAttribute("aria-hidden", String(!opened));
    skipLink.inert = !opened;

    if (!moveFocus) return;
    const target = posterActive ? continueButton : envelopeActive ? envelopeButton : main;
    target.focus({ preventScroll: true });
    requestAnimationFrame(() => { if (document.activeElement !== target) target.focus({ preventScroll: true }); });
    if (envelopeActive) window.setTimeout(() => {
      if (stage === nextStage && document.activeElement !== target) target.focus({ preventScroll: true });
    }, 480);
  };

  const showEnvelope = () => {
    if (stage !== "poster-visible") return;
    window.clearTimeout(stageTimer);
    posterGate.classList.add("poster-fading");
    stageTimer = window.setTimeout(() => setStage("envelope-visible", true), reduceMotion.matches ? 80 : 720);
  };

  const schedulePoster = () => {
    window.clearTimeout(stageTimer);
    stageTimer = window.setTimeout(showEnvelope, reduceMotion.matches ? 350 : 2500);
  };

  const openEnvelope = () => {
    if (stage !== "envelope-visible") return;
    setStage("envelope-opening");
    playGateSound();
    startBackgroundMusic();
    stageTimer = window.setTimeout(() => {
      try { sessionStorage.setItem("halloweenEnvelopeFlowV3", "1"); } catch (_) {}
      setStage("invitation-opened", true);
      refreshScrollAnimations();
    }, reduceMotion.matches ? 160 : 2250);
  };

  const openedThisSession = html.classList.contains("invitation-opened");
  setStage(openedThisSession ? "invitation-opened" : "poster-visible");
  if (!openedThisSession) {
    requestAnimationFrame(() => continueButton.focus({ preventScroll: true }));
    schedulePoster();
  }

  continueButton.addEventListener("click", showEnvelope);
  continueButton.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    showEnvelope();
  });
  envelopeButton.addEventListener("click", openEnvelope);
  envelopeButton.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openEnvelope();
  });

  document.addEventListener("keydown", (event) => {
    if (stage === "invitation-opened" || event.key !== "Tab") return;
    event.preventDefault();
    (stage === "poster-visible" ? continueButton : envelopeButton).focus();
  });

  $("#replayInvitation").addEventListener("click", () => {
    try { sessionStorage.removeItem("halloweenEnvelopeFlowV3"); } catch (_) {}
    resetBackgroundMusic();
    window.scrollTo(0, 0);
    setStage("poster-visible", true);
    schedulePoster();
  });
}
function initCountdown() {
  const nodes = { days: $("#days"), hours: $("#hours"), minutes: $("#minutes"), seconds: $("#seconds") };
  let previousSecond = "";
  const render = () => {
    const distance = EVENT.date.getTime() - Date.now();
    const remaining = Math.max(0, distance);
    const totalSeconds = Math.floor(remaining / 1000);
    nodes.days.textContent = String(Math.floor(totalSeconds / 86400)).padStart(3, "0");
    nodes.hours.textContent = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
    nodes.minutes.textContent = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    nodes.seconds.textContent = String(totalSeconds % 60).padStart(2, "0");
    if (distance <= 0) $("#countStatus").textContent = "LA NOCHE HA COMENZADO.";
    if (nodes.seconds.textContent !== previousSecond && totalSeconds % 11 === 0 && !reduceMotion.matches) {
      nodes.seconds.animate([{ transform: "translateX(-2px)", color: "#1eeaff" }, { transform: "translateX(2px)" }, { transform: "none" }], { duration: 180 });
      previousSecond = nodes.seconds.textContent;
    }
  };
  render();
  window.setInterval(render, 1000);
}

function initMenu() {
  const toggle = $("#menuToggle");
  const menu = $("#siteMenu");
  const links = $$("a", menu);
  let open = false;
  const setOpen = (next, returnFocus = false) => {
    open = next;
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
    menu.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("menu-open", open);
    if (open) links[0]?.focus();
    else if (returnFocus) toggle.focus();
  };
  toggle.addEventListener("click", () => setOpen(!open, open));
  links.forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (!open) return;
    if (event.key === "Escape") { setOpen(false, true); return; }
    if (event.key !== "Tab") return;
    const first = links[0];
    const last = links[links.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

function initRSVP() {
  const form = $("#rsvpForm");
  const status = $("#rsvpStatus");
  const decline = $("#declineButton");
  const whatsapp = $("#whatsappLink");
  const send = () => {
    const name = $("#rsvpName").value.trim();
    const guests = $("#guestNumber").value;
    if (!name) { status.textContent = "Escribe tu nombre para continuar."; $("#rsvpName").focus(); return; }
    if (!/^\d{8,15}$/.test(EVENT.whatsappNumber)) {
      status.textContent = "Configura EVENT.whatsappNumber en script.js para activar WhatsApp.";
      return;
    }
    const message = `Hola, confirmo mi asistencia a Halloween Fest. Nombre: ${name}. Invitados: ${guests}.`;
    const newWindow = window.open(`https://wa.me/${EVENT.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
    status.textContent = "Tu mensaje de confirmación está listo en WhatsApp.";
  };
  form.addEventListener("submit", (event) => { event.preventDefault(); send(); });
  whatsapp.addEventListener("click", (event) => { event.preventDefault(); send(); });
  decline.addEventListener("click", () => {
    status.textContent = "Gracias por avisarnos. Dejaremos una luz encendida para ti.";
    decline.textContent = "AVISO RECIBIDO";
    decline.disabled = true;
  });
}

function initAudio() {
  const music = $("#backgroundMusic");
  const button = $("#soundToggle");
  const label = $("#soundLabel");
  const targetVolume = .35;
  let fadeFrame = 0;
  let unavailable = false;
  let userActivated = false;
  let pausedForVisibility = false;
  let desiredEnabled = true;

  try { desiredEnabled = sessionStorage.getItem("halloweenMusicEnabled") !== "0"; } catch (_) {}
  music.loop = true;
  music.volume = 0;
  if (saveData) music.preload = "none";

  const setControl = (playing) => {
    button.setAttribute("aria-pressed", String(playing));
    if (unavailable) {
      label.textContent = "MÚSICA NO DISPONIBLE";
      button.setAttribute("aria-label", "Música no disponible");
      return;
    }
    label.textContent = playing ? "MÚSICA ON" : "MÚSICA OFF";
    button.setAttribute("aria-label", playing ? "Desactivar música" : "Activar música");
  };

  const fadeVolume = (to, duration, onComplete) => {
    cancelAnimationFrame(fadeFrame);
    const from = Number.isFinite(music.volume) ? music.volume : 0;
    const started = performance.now();
    const update = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      try { music.volume = from + (to - from) * progress; } catch (_) {}
      if (progress < 1 && !document.hidden) fadeFrame = requestAnimationFrame(update);
      else if (onComplete) onComplete();
    };
    fadeFrame = requestAnimationFrame(update);
  };

  const markUnavailable = () => {
    unavailable = true;
    cancelAnimationFrame(fadeFrame);
    music.pause();
    setControl(false);
  };

  const playWithFade = async () => {
    if (unavailable) { setControl(false); return false; }
    userActivated = true;
    pausedForVisibility = false;
    if (saveData && music.preload !== "auto") {
      music.preload = "auto";
      music.load();
    }
    try {
      music.volume = 0;
      const request = music.play();
      if (request && typeof request.then === "function") await request;
      fadeVolume(targetVolume, 1200);
      setControl(true);
      return true;
    } catch (_) {
      markUnavailable();
      return false;
    }
  };

  startBackgroundMusic = () => {
    userActivated = true;
    if (!desiredEnabled) { setControl(false); return Promise.resolve(false); }
    return playWithFade();
  };

  resetBackgroundMusic = () => {
    cancelAnimationFrame(fadeFrame);
    music.pause();
    try { music.currentTime = 0; } catch (_) {}
    music.volume = 0;
    userActivated = false;
    pausedForVisibility = false;
    setControl(false);
  };

  button.addEventListener("click", () => {
    if (unavailable) { setControl(false); return; }
    if (!music.paused) {
      desiredEnabled = false;
      try { sessionStorage.setItem("halloweenMusicEnabled", "0"); } catch (_) {}
      setControl(false);
      fadeVolume(0, 550, () => music.pause());
      return;
    }
    desiredEnabled = true;
    try { sessionStorage.setItem("halloweenMusicEnabled", "1"); } catch (_) {}
    playWithFade();
  });

  music.addEventListener("error", markUnavailable);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pausedForVisibility = !music.paused && desiredEnabled && userActivated;
      cancelAnimationFrame(fadeFrame);
      music.pause();
      setControl(false);
    } else if (pausedForVisibility && desiredEnabled && userActivated) {
      playWithFade();
    }
  });

  setControl(false);
}
function initFallbackReveals() {
  const revealNodes = $$(".reveal, .reveal-card, .timeline-item");
  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add(node.classList.contains("timeline-item") ? "is-active" : "is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, current) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add(entry.target.classList.contains("timeline-item") ? "is-active" : "is-visible");
    current.unobserve(entry.target);
  }), { threshold: .15, rootMargin: "0px 0px -8%" });
  revealNodes.forEach((node) => observer.observe(node));
}

function initScrollAnimations() {
  if (reduceMotion.matches || saveData) {
    $$(".reveal, .reveal-card, .timeline-item").forEach((node) => node.classList.add(node.classList.contains("timeline-item") ? "is-active" : "is-visible"));
    return;
  }
  if (!hasGsap) {
    initFallbackReveals();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  $$(".reveal").forEach((node) => gsap.fromTo(node,
    { y: 24, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: .7, ease: "power2.out", scrollTrigger: { trigger: node, start: "top 86%", once: true }, onComplete: () => node.classList.add("is-visible") }
  ));

  $$(".reveal-card").forEach((node, index) => gsap.fromTo(node,
    { y: 30, autoAlpha: 0, rotate: index % 2 ? .5 : -.5 },
    { y: 0, autoAlpha: 1, rotate: 0, duration: .78, delay: (index % 3) * .06, ease: "power2.out", scrollTrigger: { trigger: node, start: "top 88%", once: true }, onComplete: () => node.classList.add("is-visible") }
  ));

  gsap.fromTo(".countdown > div",
    { y: 20, autoAlpha: 0, scale: .96 },
    { y: 0, autoAlpha: 1, scale: 1, duration: .6, stagger: .09, ease: "back.out(1.4)", scrollTrigger: { trigger: ".countdown", start: "top 84%", once: true } }
  );

  $$(".timeline-item").forEach((item, index) => gsap.fromTo(item,
    { x: index % 2 ? 18 : -18, autoAlpha: .2 },
    { x: 0, autoAlpha: 1, duration: .72, ease: "power2.out", scrollTrigger: { trigger: item, start: "top 80%", once: true, onEnter: () => item.classList.add("is-active") } }
  ));

  gsap.to("#maskStage", { y: 34, ease: "none", scrollTrigger: { trigger: "#top", start: "top top", end: "bottom top", scrub: .55 } });
  gsap.to(".paint-green", { xPercent: -8, ease: "none", scrollTrigger: { trigger: "#top", start: "top top", end: "bottom top", scrub: .65 } });
  gsap.to(".paint-purple", { xPercent: 9, ease: "none", scrollTrigger: { trigger: "#top", start: "top top", end: "bottom top", scrub: .65 } });

  gsap.fromTo(".rsvp-panel",
    { y: 34, autoAlpha: 0, boxShadow: "0 0 0 rgba(173,35,255,0)" },
    { y: 0, autoAlpha: 1, boxShadow: "10px 10px 0 #ad23ff", duration: .9, ease: "power2.out", scrollTrigger: { trigger: "#rsvp", start: "top 72%", once: true } }
  );
  gsap.fromTo(".rsvp-panel .section-title, .rsvp-panel .primary-button",
    { y: 18, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: .62, stagger: .12, ease: "power2.out", scrollTrigger: { trigger: "#rsvp", start: "top 68%", once: true } }
  );

  refreshScrollAnimations = () => requestAnimationFrame(() => ScrollTrigger.refresh());
  const imageReady = $$("img").map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => image.addEventListener("load", resolve, { once: true })));
  Promise.all(imageReady).then(refreshScrollAnimations);
  window.addEventListener("load", refreshScrollAnimations, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) gsap.globalTimeline.pause();
    else { gsap.globalTimeline.resume(); refreshScrollAnimations(); }
  });
}

function initScrollEffects() {
  const progress = $("#scrollProgress");
  const hero = $("#top");
  const mask = $("#maskStage");
  let queued = false;
  const update = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      const range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      progress.style.transform = `scaleX(${Math.min(1, scrollY / range)})`;
      if (!hasGsap && !reduceMotion.matches && hero.getBoundingClientRect().bottom > 0) mask.style.setProperty("--mask-y", `${Math.min(32, scrollY * .035)}px`);
      queued = false;
    });
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update, { passive: true });
  update();
  if (finePointer.matches && !reduceMotion.matches) hero.addEventListener("pointermove", (event) => {
    mask.style.setProperty("--mask-x", `${(event.clientX / innerWidth - .5) * -14}px`);
  }, { passive: true });
}

function initTouchLights() {
  const targets = $$(".detail-card, .rule, .primary-button");
  const update = (target, event) => {
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    target.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
  };
  targets.forEach((target) => {
    target.addEventListener("pointerdown", (event) => { target.dataset.pressed = "true"; update(target, event); });
    target.addEventListener("pointermove", (event) => { if (target.dataset.pressed) update(target, event); });
    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => target.addEventListener(type, () => { delete target.dataset.pressed; }));
  });
}

function initGlitch() {
  const title = $(".glitch-title");
  if (reduceMotion.matches) return;
  let timer;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!document.hidden) { title.classList.add("glitching"); window.setTimeout(() => title.classList.remove("glitching"), 430); }
      schedule();
    }, 6500 + Math.random() * 7000);
  };
  schedule();
  document.addEventListener("visibilitychange", () => { if (document.hidden) window.clearTimeout(timer); else schedule(); });
}

function initParticles() {
  if (reduceMotion.matches || saveData) return;
  const canvas = $("#particles");
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;
  let particles = [];
  let frame = 0;
  let last = 0;
  let width = 0;
  let height = 0;
  const resize = () => {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.25);
    canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: width < 700 ? 12 : 25 }, () => ({ x: Math.random() * width, y: Math.random() * height, s: .15 + Math.random() * .35, r: .5 + Math.random() * 1.2, c: Math.random() > .65 ? "#ad23ff" : "#82ff19" }));
  };
  const draw = (time) => {
    if (time - last > 40) {
      last = time; context.clearRect(0, 0, width, height);
      particles.forEach((p) => { p.y -= p.s; if (p.y < -3) { p.y = height + 3; p.x = Math.random() * width; } context.globalAlpha = .28; context.fillStyle = p.c; context.beginPath(); context.arc(p.x, p.y, p.r, 0, Math.PI * 2); context.fill(); });
    }
    if (!document.hidden) frame = requestAnimationFrame(draw);
  };
  resize(); frame = requestAnimationFrame(draw);
  addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(frame); else frame = requestAnimationFrame(draw); });
}

setEventDetails();
initAudio();
initInvitationGate();
initCountdown();
initMenu();
initRSVP();
initScrollAnimations();
initScrollEffects();
initTouchLights();
initGlitch();
initParticles();
