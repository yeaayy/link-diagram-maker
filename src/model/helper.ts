
export function div(...props: (string | ((el: HTMLElement) => void) | HTMLElement)[]) {
  const result = document.createElement('div');
  for (const prop of props) {
    if (prop instanceof HTMLElement) {
      result.appendChild(prop);
    } else if (prop instanceof Function) {
      prop(result);
    } else {
      result.classList.add(prop);
    }
  }
  return result;
}

export function generateId(): string {
  const result = [];
  for (let i = 0; i < 8; i++) {
    result.push(Math.floor(Math.random() * 16).toString(16));
  }
  return result.join('');
}
