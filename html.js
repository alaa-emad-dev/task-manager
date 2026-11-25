// htm lets us write JSX-like templates without a build step:
//   html`<div className="x">${value}</div>`  ===  <div className="x">{value}</div>
import htm from "htm";
import { createElement } from "react";

export const html = htm.bind(createElement);
