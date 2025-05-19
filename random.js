/**
 * Random-character text transition that preserves any nested HTML.
 *
 * Thanks, ChatGPT!
 *
 * @param {HTMLElement|string} rootEl   The element or selector you want to animate.
 * @param {string}            finalHTML String of HTML for the final state.
 * @param {object}            [opts]
 * @param {string}            [opts.chars]     Pool of random characters.
 * @param {number}            [opts.interval]  ms between animation frames.
 * @param {number}            [opts.flicker]   Probability (0–1) to flicker each unrevealed char.
 */
function randomTextTransitionNested(rootEl, finalHTML, opts = {}) {
    if (typeof rootEl === 'string') rootEl = document.querySelector(rootEl);
    if (!rootEl) throw new Error('Container element not found');
  
    const {
      chars    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      interval = 0,
      flicker  = 0.1,
    } = opts;
  
    // 1) Build two identical trees
    const finalWrapper   = document.createElement('div');
    const workingWrapper = document.createElement('div');
    finalWrapper.innerHTML   = finalHTML;
    workingWrapper.innerHTML = finalHTML;
  
    // 2) Collect all text nodes
    function getTextNodes(node, out = []) {
      for (let c of node.childNodes) {
        if (c.nodeType === Node.TEXT_NODE) {
          out.push(c);
        } else if (c.nodeType === Node.ELEMENT_NODE) {
          getTextNodes(c, out);
        }
      }
      return out;
    }
  
    const finalTextNodes   = getTextNodes(finalWrapper);
    const workingTextNodes = getTextNodes(workingWrapper);
  
    // 3) Extract strings & init work arrays, but lock in *all* whitespace immediately
    const finalStrings = finalTextNodes.map(n => n.textContent || '');
    const workArrays   = finalStrings.map(str =>
      Array.from(str, ch =>
        /\s/.test(ch)   // any whitespace → keep as-is
          ? ch
          : chars[Math.random() * chars.length | 0]
      )
    );
  
    // 4) Render the working tree in place
    rootEl.innerHTML = '';
    for (let node of workingWrapper.childNodes) {
      rootEl.appendChild(node.cloneNode(true));
    }
  
    // 5) Build reveal list for *non*-whitespace positions only
    const revealPositions = [];
    finalStrings.forEach((str, ni) => {
      for (let ci = 0; ci < str.length; ci++) {
        if (!/\s/.test(str[ci])) {
          revealPositions.push([ni, ci]);
        }
      }
    });
    // shuffle
    revealPositions.sort(() => Math.random() - 0.5);
  
    // 6) Animation loop
    let step = 0;
    const timer = setInterval(() => {
      // lock in next real char
      if (step < revealPositions.length) {
        const [ni, ci] = revealPositions[step++];
        workArrays[ni][ci] = finalStrings[ni][ci];
      }
      // flicker the rest
      for (let k = step; k < revealPositions.length; k++) {
        const [ni, ci] = revealPositions[k];
        if (Math.random() < flicker) {
          workArrays[ni][ci] = chars[Math.random() * chars.length | 0];
        }
      }
      // flush back to the live DOM
      const liveTextNodes = getTextNodes(rootEl);
      liveTextNodes.forEach((n, i) => {
        n.textContent = workArrays[i].join('');
      });
      // finish
      if (step >= revealPositions.length) {
        clearInterval(timer);
        liveTextNodes.forEach((n, i) => {
          n.textContent = finalStrings[i];
        });
      }
    }, interval);
  }
  