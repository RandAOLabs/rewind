export function fmtDate(ts?: number) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  export function ellip(str?: string, keep = 5) {
    if (!str) return '—';
    if (str.length <= keep * 2 + 3) return str;
    return `${str.slice(0, keep)}…${str.slice(-keep)}`;
  }
  