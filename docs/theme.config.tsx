import React from "react";

const Logo = React.forwardRef<HTMLSpanElement>(
  function Logo(_, ref) {
    return <span ref={ref}>Stratum Rollbar</span>;
  }
);

export default {
  docsRepositoryBase:
    "https://github.com/rachelallyson/stratum-rollbar-js/tree/main/docs/content",
  footer: {
    text: `© ${new Date().getFullYear()} Stratum Rollbar Plugin`,
  },
  logo: <Logo />,
  project: {
    link: "https://github.com/rachelallyson/stratum-rollbar-js",
  },
  primaryHue: { dark: 200, light: 200 },
  breadcrumb: true,
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  search: {
    codeblocks: false,
    placeholder: "Search documentation…",
  },
  toc: {
    backToTop: true,
  },
  navigation: {
    prev: true,
    next: true,
  },
};
