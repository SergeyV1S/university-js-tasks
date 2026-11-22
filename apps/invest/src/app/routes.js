const COIN_ROUTE = /^#\/coin\/([^/]+)$/;

export function readRoute(hash) {
  if (hash === "#/portfolio") {
    return { screen: "portfolio" };
  }

  const match = COIN_ROUTE.exec(hash);
  if (match) {
    try {
      return { screen: "coin", coinId: decodeURIComponent(match[1]) };
    } catch {
      return { screen: "home" };
    }
  }

  return { screen: "home" };
}

export function coinHref(id) {
  return `#/coin/${encodeURIComponent(id)}`;
}
