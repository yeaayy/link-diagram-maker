export default function copyText(text: string) {
  const input = document.createElement('input');
  document.body.appendChild(input);
  input.value = text;
  input.select();
  input.setSelectionRange(0, text.length);
  navigator.clipboard.writeText(text);
  document.body.removeChild(input);
}
