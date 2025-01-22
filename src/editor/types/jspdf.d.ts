import jspdf from 'jspdf'

declare  global {
  interface Window {
    jspdf: {jsPDF: typeof jspdf};
  }
}
