/** Lista lateral de componentes — também é o caminho de seleção sem mouse. */

export function createLegend({ listElement, catalog, onSelect }) {
  const buttons = new Map();

  const fragment = document.createDocumentFragment();

  for (const entry of catalog) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'legend-item';
    button.dataset.part = entry.id;
    button.setAttribute('aria-current', 'false');
    button.innerHTML = `<span class="legend-index">${entry.index}</span><span>${entry.name}</span>`;
    button.addEventListener('click', () => onSelect?.(entry.id));
    item.appendChild(button);
    fragment.appendChild(item);
    buttons.set(entry.id, button);
  }

  listElement.replaceChildren(fragment);

  return {
    setActive(id) {
      for (const [key, button] of buttons) {
        button.setAttribute('aria-current', String(key === id));
      }
    },
  };
}
