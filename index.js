"use strict";

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
 *      }} Merci
 */

function loadMercis() {
    $.ajax("https://mercirobin-52f7d-default-rtdb.firebaseio.com/mercis.json", {
        method: "GET",
    }).then((mercis) => {
        console.log(mercis);
        Object.values(mercis).forEach((merci) => {
            console.log(merci);
            loadMerci(merci);
        });
    });
}

/**
 * @param {Merci} merci
 */
function loadMerci(merci) {
    ctx.fillStyle = merci.color;
    ctx.fillText(merciToString(merci), merci.position.x, merci.position.y);
}

const merciPreview = {
    m: 1,
    e: 1,
    r: 1,
    c: 1,
    i: 1,
    position: {
        x: 0,
        y: 0,
    },
    color: "black",
};

const merciPreviewEl = document.getElementById("merci-preview");
const inputs = document.querySelector("#create-merci");
for (const child of inputs.children) {
    if (child.nodeName === "INPUT") {
        console.log(child);
        child.addEventListener("input", () => {
            merciPreview[child.id] = child.value;
            merciPreviewEl.innerText = merciToString(merciPreview);
            merciPreviewEl.style.color = merciPreview.color;
        });
        merciPreview[child.id] = child.value;
    }
    merciPreviewEl.innerText = merciToString(merciPreview);
    merciPreviewEl.style.color = merciPreview.color;
}

/**
 * @param {Merci} merci
 */
function merciToString(merci) {
    let s = "";
    for (const letter of "merci") {
        s += letter.repeat(merci[letter]).toUpperCase();
    }
    return s;
}

const dialog = document.getElementById("create-merci-dialog");
/**
 * @param {MouseEvent} e
 */
function createMerci(e) {
    dialog.showModal();
    merciPreview.position.x = (e.clientX - canvas.offsetLeft) / ratio;
    merciPreview.position.y = (e.clientY - canvas.offsetTop) / ratio;
    console.log(merciPreview.position);
}

$("#merci-robin-canvas").on("click", createMerci);

$("#share-canvas").on("click", () => {
    const dataUrl = canvas.toDataURL();
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "merci.png";
    a.click();
});

$("#submit-merci").on("click", (e) => {
    e.preventDefault();
    $.ajax("https://mercirobin-52f7d-default-rtdb.firebaseio.com/mercis.json", {
        method: "POST",
        data: JSON.stringify(merciPreview),
    });
    dialog.close();
    loadMerci(merciPreview);
    setTimeout(() => alert("Merci created!"), 500);
});
