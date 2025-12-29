"use strict";

// const $ = require("jquery");

/** @type HTMLCanvasElement **/
const canvas = document.getElementById("merci-robin-canvas");

const originalHeight = canvas.height;
const originalWidth = canvas.width;
const ctx = canvas.getContext("2d");
render();

const ratio = Math.min(
  canvas.clientWidth / originalWidth,
  canvas.clientHeight / originalHeight,
);
ctx.scale(ratio, ratio); //adjust this!
loadMercis();

function render() {
  const dimensions = getObjectFitSize(
    true,
    canvas.clientWidth,
    canvas.clientHeight,
    canvas.width,
    canvas.height,
  );

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
}

function getObjectFitSize(
  contains /* true = contain, false = cover */,
  containerWidth,
  containerHeight,
  width,
  height,
) {
  var doRatio = width / height;
  var cRatio = containerWidth / containerHeight;
  var targetWidth = 0;
  var targetHeight = 0;
  var test = contains ? doRatio > cRatio : doRatio < cRatio;

  if (test) {
    targetWidth = containerWidth;
    targetHeight = targetWidth / doRatio;
  } else {
    targetHeight = containerHeight;
    targetWidth = targetHeight * doRatio;
  }

  return {
    width: targetWidth,
    height: targetHeight,
    x: (containerWidth - targetWidth) / 2,
    y: (containerHeight - targetHeight) / 2,
  };
}

/**
 * @typedef {{
 *          position: {x: number; y: number};
 *          m: 1,
 *          e: 1,
 *          r: 1,
 *          c: 1,
 *          i: 1,
 *          color: string;
 *          fontFamily: string;
 *      }} Merci
 */

const nbMercis = $("#nb-mercis");
let MERCIS = [];

function loadMercis() {
  $.ajax("https://mercirobin-52f7d-default-rtdb.firebaseio.com/mercis.json", {
    method: "GET",
  }).then((mercis) => {
    MERCIS = Object.values(mercis);
    nbMercis.text(MERCIS.length);

    MERCIS.forEach((merci) => {
      try {
        loadMerci(merci);
      } catch {
        console.log("Un merci invalide est si vite arrivé !");
      }
    });
  });
}

function clamp(n, min, max) {
  if (n < min) return min;
  else if (n > max) return max;
  return n;
}

/**
 * @param {Merci} merci
 */
function loadMerci(merci) {
  ctx.fillStyle = merci.color;
  ctx.font = `bold 5px ${merci.fontFamily ?? "Arial"}`;
  let merciString = "MERCI";
  try {
    merciString = merciToString(merci);
  } catch {}

  ctx.fillText(
    merciString,
    clamp(merci.position.x, 0, ctx.canvas.width),
    clamp(merci.position.y, 0, ctx.canvas.height),
  );
}

const merciPreview = {
  m: 1,
  e: 1,
  r: 1,
  c: 1,
  i: 1,
  signature: "",
  position: {
    x: 0,
    y: 0,
  },
  color: "black",
  fontFamily: "Arial",
};

const merciPreviewEl = document.getElementById("merci-preview");
const inputs = document.querySelector("#create-merci");
for (const child of inputs.children) {
  if (child.nodeName === "INPUT" || child.nodeName === "SELECT") {
    console.log(child);
    child.addEventListener("input", () => {
      merciPreview[child.id] = child.value;
      merciPreviewEl.innerText = merciToString(merciPreview);
      merciPreviewEl.style.color = merciPreview.color;
      merciPreviewEl.style.fontFamily = merciPreview.fontFamily;
    });
    merciPreview[child.id] = child.value;
  }
  merciPreviewEl.innerText = merciToString(merciPreview);
  merciPreviewEl.style.color = merciPreview.color;
  merciPreviewEl.style.fontFamily = merciPreview.fontFamily;
}

/**
 * @param {Merci} merci
 */
function merciToString(merci) {
  let s = "";
  for (const letter of "merci") {
    s += letter.repeat(clamp(merci[letter], 1, 5)).toUpperCase();
  }
  return s;
}

const dialog = document.getElementById("create-merci-dialog");
/**
 * @param {MouseEvent} e
 */
function createMerci(e) {
  dialog.showModal();
  merciPreview.position.x =
    (e.clientX - canvas.offsetLeft + window.scrollX) / ratio;
  merciPreview.position.y =
    (e.clientY - canvas.offsetTop + window.scrollY) / ratio;
}

const popupsign = document.getElementById("popup-sign");

$("#merci-robin-canvas").on("mousemove", (e) => {
  const x = (e.clientX - canvas.offsetLeft + window.scrollX) / ratio;
  const y = (e.clientY - canvas.offsetTop + window.scrollY) / ratio;
  let oneOfThem = false;
  MERCIS.forEach((merci) => {
    if (
      x > merci.position.x &&
      x < merci.position.x + ctx.measureText(merciToString(merci)).width &&
      y > merci.position.y - 5 &&
      y < merci.position.y
    ) {
      popupsign.style.visibility = "visible";
      popupsign.innerText = `${merci.signature ?? "Anonyme"}${e.shiftKey ? ` (${merci.position.x?.toFixed(2)}, ${merci.position.y?.toFixed(2)})` : ""}`;
      popupsign.style.left = `${e.clientX + 20 + window.scrollX}px`;
      popupsign.style.top = `${e.clientY + 10 + window.scrollY}px`;

      oneOfThem = true;
    }
  });
  !oneOfThem && (popupsign.style.visibility = "hidden");
});
$("#merci-robin-canvas").on("click", createMerci);

$("#share-canvas").on("click", () => {
  const dataUrl = canvas.toDataURL();
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "merci.png";
  a.click();
});

$("#annuler-merci").on("click", (e) => {
  e.preventDefault();
  dialog.close();
});

$("#submit-merci").on("click", (e) => {
  e.preventDefault();
  if (merciPreview.signature === "") delete merciPreview.signature;
  $.ajax("https://mercirobin-52f7d-default-rtdb.firebaseio.com/mercis.json", {
    method: "POST",
    data: JSON.stringify(merciPreview),
  });
  dialog.close();
  loadMercis();
  setTimeout(() => alert("Merci created!"), 500);
});
