async function loadAulas() {
  try {
    const res = await fetch("aulas/aulas.json");
    const aulas = await res.json();

    const sidebar = document.getElementById("sidebar-links");
    const cards = document.getElementById("cards-container");

    // 🔹 Cabeçalho de Aulas
    if (sidebar && aulas.length > 0) {
      const header = document.createElement("div");
      header.className =
        "mt-4 mb-2 px-2 py-1 bg-slate-700 text-slate-100 text-sm font-bold rounded";
      header.textContent = "Aulas";
      sidebar.appendChild(header);
    }

    aulas.forEach((aula) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" class="block font-bold ${
        aula.ativo ? "hover:text-indigo-400" : "nav-link-disabled"
      } transition-colors" ${
        aula.ativo ? `onclick="loadAula('aulas/${aula.arquivo}')"` : ""
      }>${aula.titulo}</a>`;
      sidebar.appendChild(li);

      const card = document.createElement("a");
      card.className = `block bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all ${
        !aula.ativo ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      }`;
      if (aula.ativo)
        card.setAttribute("onclick", `loadAula('aulas/${aula.arquivo}')`);
      card.innerHTML = `<h3 class="font-bold text-xl text-indigo-600 mb-2">${
        aula.titulo.split(":")[0]
      }</h3><p>${aula.descricao}</p>`;
      cards.appendChild(card);
    });
  } catch (err) {
    console.error("Erro ao carregar aulas.json:", err);
  }
}

// Carrega o HTML de uma aula
function loadAula(file) {
  fetch(file)
    .then((r) => r.text())
    .then((html) => {
      const conteudo = document.getElementById("conteudo");
      conteudo.innerHTML = html;
      initAccordions();
      // Inject copy buttons for any <pre> inside the loaded aula
      enhanceCodeBlocks(conteudo);
      initCopyButtons();
      initLaboratorioGeneros();
      window.scrollTo({ top: conteudo.offsetTop - 20, behavior: "smooth" });
    })
    .catch((err) => console.error("Erro ao carregar aula:", err));
}

async function loadListas() {
  try {
    const res = await fetch("listas/listas.json");
    const listas = await res.json();

    const container = document.getElementById("listas-container");
    const sidebar = document.getElementById("sidebar-links");

    // 🔹 Cabeçalho de Listas
    if (sidebar && listas.length > 0) {
      const headerListas = document.createElement("div");
      headerListas.className =
        "mt-6 mb-2 px-2 py-1 bg-indigo-600 text-white text-sm font-bold rounded";
      headerListas.textContent = "Listas de Exercícios";
      sidebar.appendChild(headerListas);
    }

    listas.forEach((lista) => {
      if (container) {
        const card = document.createElement("div");
        card.className =
          "bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer";
        card.innerHTML = `
          <h3 class="font-bold text-xl text-indigo-600 mb-2">${lista.titulo}</h3>
          <p class="text-slate-600">${lista.descricao}</p>
        `;
        card.onclick = () => loadListaDetalhe(lista.arquivo);
        container.appendChild(card);
      }

      if (sidebar) {
        const li = document.createElement("li");
        li.innerHTML = `<a href="#" class="block font-bold hover:text-indigo-400 transition-colors"
          onclick="loadListaDetalhe('${lista.arquivo}')">${lista.titulo}</a>`;
        sidebar.appendChild(li);
      }
    });
  } catch (err) {
    console.error("Erro ao carregar listas:", err);
  }
}

async function loadListaDetalhe(file) {
  try {
    const metaRes = await fetch("listas/listas.json");
    const listas = await metaRes.json();
    const meta = listas.find((l) => l.arquivo === file);

    const res = await fetch(`listas/${file}`);
    const data = await res.json();

    const conteudo = document.getElementById("conteudo");
    conteudo.innerHTML = "";

    const section = document.createElement("section");
    section.className = "mb-16 pt-16";
    section.innerHTML = `
      <header class="mb-12">
        <h2 class="text-4xl font-bold text-slate-900">${data.titulo}</h2>
        <p class="text-lg text-slate-600 mt-2">${data.descricao}</p>
      </header>
        <div id="questoes" class="grid md:grid-cols-1 gap-6"></div>
    `;
    conteudo.appendChild(section);

    const questoesContainer = section.querySelector("#questoes");

    data.questoes.forEach((q) => {
      const div = document.createElement("div");
      div.className = "bg-white border border-slate-200 rounded-lg";

      const disabled = !meta.mostrar_solucoes;

      div.innerHTML = `
        <div class="p-5 ">
          <p class="font-semibold">${q.id}. ${q.enunciado}</p>
          <div class="mt-2 text-sm text-slate-600">
            <p><strong>Dica:</strong> ${q.dica}</p>
          </div>
        </div>
        <div class="border-t border-slate-200">
          <button class="accordion-toggle w-full flex justify-between items-center p-3 font-semibold text-left text-sm ${
            disabled ? "text-gray-400 cursor-not-allowed" : "text-indigo-700"
          }"
            aria-expanded="false" ${disabled ? "disabled" : ""}>
            <span>${disabled ? "Solução bloqueada" : "Mostrar Solução"}</span>
            <span class="transform transition-transform duration-300 rotate-180">▼</span>
          </button>
          <div class="accordion-content overflow-hidden transition-all duration-500 ease-in-out"
            style="max-height: 0px">
            <div class="p-4 bg-slate-800 text-white mono text-sm">
              <pre><code>${q.solucao}</code></pre>
            </div>
          </div>
        </div>
      `;
      questoesContainer.appendChild(div);
    });

    initAccordions();

    // Inject copy buttons for any <pre> in the list detail (solutions, etc.)
    enhanceCodeBlocks(section);
    
    requestAnimationFrame(() => {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  } catch (err) {
    console.error("Erro ao carregar lista detalhada:", err);
  }
}

// Inicializa acordeões
function initAccordions() {
  const accordions = document.querySelectorAll(".accordion-toggle");
  accordions.forEach((button) => {
    button.addEventListener("click", () => {
      const content = button.nextElementSibling;
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", !isExpanded);
      button.querySelector("span:last-child").style.transform = isExpanded
        ? "rotate(180deg)"
        : "rotate(0deg)";
      content.style.maxHeight = isExpanded
        ? "0px"
        : content.scrollHeight + "px";
    });
  });
}

// Inicializa botão de copiar código
function initCopyButtons() {
  const copyButton = document.querySelector(".copy-code-btn");
  if (copyButton) {
    copyButton.addEventListener("click", () => {
      const codeToCopy = document.getElementById("code-sizeof").innerText;
      navigator.clipboard
        .writeText(codeToCopy)
        .then(() => {
          copyButton.innerText = "Copiado!";
          setTimeout(() => {
            copyButton.innerText = "Copiar Código";
          }, 2000);
        })
        .catch((err) => {
          console.error("Erro ao copiar o texto: ", err);
          const textarea = document.createElement("textarea");
          textarea.value = codeToCopy;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          copyButton.innerText = "Copiado!";
          setTimeout(() => {
            copyButton.innerText = "Copiar Código";
          }, 2000);
        });
    });
  }
}

function initLaboratorioGeneros() {
  const draggables = document.querySelectorAll(".draggable");
  const dropzones = document.querySelectorAll(".dropzone");
  const verificarBtn = document.getElementById("verificar");
  const resultado = document.getElementById("resultado");

  if (draggables.length === 0 || dropzones.length === 0 || !verificarBtn) {
    console.warn("Laboratório de Gêneros não encontrado nesta página.");
    return;
  }

  let dragged = null;

  draggables.forEach((el) => {
    el.addEventListener("dragstart", () => (dragged = el));
    el.addEventListener("dragend", () => (dragged = null));
  });

  dropzones.forEach((zone) => {
    zone.addEventListener("dragover", (e) => e.preventDefault());
    zone.addEventListener("drop", () => {
      if (dragged) zone.appendChild(dragged);
    });
  });

  verificarBtn.addEventListener("click", () => {
    let acertos = 0;
    dropzones.forEach((zone) => {
      zone.querySelectorAll(".draggable").forEach((el) => {
        if (el.dataset.gen === zone.dataset.accept) acertos++;
      });
    });
    resultado.textContent = `Você acertou ${acertos} de ${draggables.length}!`;
  });
}

// ===== Copy-to-clipboard (global + works with dynamic content) =====

// Run once on startup
setupCopyToClipboard();

/**
 * Global click delegation for any copy button.
 * Works for dynamically injected content, no re-bind needed.
 */
function setupCopyToClipboard() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".copy-code-btn, [data-copy-target]");
    if (!btn) return;

    e.preventDefault();

    // Prefer a selector defined in data attributes:
    const selector = btn.getAttribute("data-copy-target") || btn.getAttribute("data-copy");
    let text = "";

    if (selector) {
      // Try to resolve relative to the nearest wrapper first, then globally.
      const scope = btn.closest(".code-block-wrapper") || document;
      const node = scope.querySelector(selector) || document.querySelector(selector);
      if (node) text = node.innerText || node.textContent || "";
    }

    // Auto-discover <pre> if no selector was provided or nothing found
    if (!text) {
      const scope = btn.closest(".code-block-wrapper") || document;
      const pre = scope.querySelector("pre");
      if (pre) text = pre.innerText || pre.textContent || "";
    }

    if (!text) return;

    // Try modern API first, then fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => flashCopied(btn))
        .catch(() => fallbackCopy(text, btn));
    } else {
      fallbackCopy(text, btn);
    }
  });
}

/** Visual feedback "Copiado!" then restore. */
function flashCopied(btn) {
  const original = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Copiado!';
  setTimeout(() => (btn.innerHTML = original), 2000);
}

/** Fallback using a temporary textarea (works in iframes/restrições). */
function fallbackCopy(text, btn) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Fallback copy failed:", err);
  }
  document.body.removeChild(ta);
  flashCopied(btn);
}

/**
 * Inject a copy button for every <pre> block inside "root".
 * Call this after you inject HTML (loadAula / loadListaDetalhe).
 */
function enhanceCodeBlocks(root = document) {
  // NOTE: We intentionally target <pre> (language-agnostic)
  root.querySelectorAll("pre").forEach((pre) => {
    // Ensure a wrapper with relative positioning exists
    let wrapper = pre.closest(".code-block-wrapper");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper relative";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
    }

    // Avoid duplicates
    if (wrapper.querySelector(".copy-code-btn")) return;

    // Create the button
    const btn = document.createElement("button");
    btn.type = "button";
    // Tailwind classes (matching your style)
    btn.className =
      "copy-code-btn absolute top-2 right-2 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors";
    btn.innerHTML = '<i class="fa-solid fa-copy mr-1"></i> Copiar';
    wrapper.appendChild(btn);
  });
}

// Quando o DOM estiver pronto, carrega aulas
document.addEventListener("DOMContentLoaded", () => {
  loadAulas();
  loadListas();
});
