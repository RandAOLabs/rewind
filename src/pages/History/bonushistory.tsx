
/* the scrollable container around the undername list */
.undername-scroll {
  max-height: 240px;          /* adjust height to taste */
  overflow-y: auto;
  padding-right: 6px;         /* room for scrollbar */
  margin-top: 6px;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 6px;
  background: rgba(255,255,255,0.02);
}

/* keep vertical scrolling only, hide bars (you already added these; keep them) */
.undername-scroll {
  overflow-y: scroll;
  overflow-x: hidden;
  scrollbar-width: none;
}
.undername-scroll::-webkit-scrollbar { display: none; }


/* list layout inside the scroll area */
.undername-list {
  list-style: none;
  margin: 0;
  padding: 8px 10px;
  display: grid;
  grid-auto-rows: minmax(26px, auto);
  row-gap: 8px;
}

.undername-list li {
  display: grid;
  grid-template-columns: 1fr auto; /* undername | hash */
  align-items: center;
  column-gap: 10px;
}

.undername-list .uname {
  font-weight: 600;
  color: #dbe2ff;
  overflow-wrap: anywhere;
}

.undername-list .hash {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  opacity: 0.9;
}






/* list layout */
.undername-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;           /* easier spacing */
  gap: 8px;                /* space between boxes */
}

/* each record as a boxed row */
.undername-list li {
  display: grid;
  grid-template-columns: 1fr auto; /* name | hash */
  align-items: center;
  gap: 10px;

  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 10px 12px;

  transition: border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease;
}

/* subtle hover */
.undername-list li:hover {
  border-color: rgba(123, 167, 255, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0,0,0,0.25);
}

/* left label */
.undername-list .uname {
  font-weight: 600;
  color: #e5e7eb;
  min-width: 0;           /* allow wrapping/ellipsis */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* right hash (monospace, truncated, link colored) */
.undername-list .hash {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.9rem;
  color: #cbd5e1;

  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.undername-list .hash a {
  color: #7aa2ff;
  text-decoration: underline;
  text-underline-offset: 2px;

  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.undername-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.25rem; }
.undername-list li { display: flex; justify-content: space-between; gap: 0.5rem; }
.uname { color: #e6e8ee; }
.hash { opacity: 0.9; }
.muted { opacity: 0.7; }

