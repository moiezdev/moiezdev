/** Shows a short message in the global toast (components/ui/Toast.jsx). */
export const showToast = (message) => window.dispatchEvent(new CustomEvent('app-toast', { detail: message }));

/** Copies text and confirms with a toast ("Copied"). */
export async function copyWithToast(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    /* clipboard blocked: the visible link still works */
  }
}
