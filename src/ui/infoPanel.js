/** Painel de informações didáticas da peça selecionada. */

export function createInfoPanel({ titleElement, summaryElement, metaElement, materialElement, observeElement }) {
  const defaultTitle = 'Selecione uma peça';
  const defaultSummary =
    'Clique em um componente do modelo ou use a lista acima para ver sua função.';

  return {
    show(entry) {
      if (!entry) {
        titleElement.textContent = defaultTitle;
        summaryElement.textContent = defaultSummary;
        metaElement.hidden = true;
        return;
      }
      titleElement.textContent = `${entry.index}. ${entry.name}`;
      summaryElement.textContent = entry.summary;
      materialElement.textContent = entry.material;
      observeElement.textContent = entry.observe;
      metaElement.hidden = false;
    },
  };
}
