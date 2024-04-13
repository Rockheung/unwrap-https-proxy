import * as http from "http";
import net from "net";

import httpProxy from "http-proxy";
import { responseInterceptor } from "http-proxy-middleware";
import Debug from "debug";

const TIMEOUT = 3000;

let count = 0;

const debug = Debug("unwrap-https-proxy");
Debug.enable("*");
const server = http.createServer();
const proxy = httpProxy.createProxyServer({
  selfHandleResponse: true,
  // secure: false,
  changeOrigin: true,
  // cookieDomainRewrite: false,
});

const targetHost = "bluemoon100.imtest.me";

// show

const checkRequestTarget = (req: http.IncomingMessage) => {
  const urlIncoming = new URL(req.url || "", `http://${req.headers.host}`);
  return urlIncoming.host === targetHost;
};

const isHostAddressIp = (host: string) => {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(host);
};

const rewriteCookieDomain = (
  proxyRes: http.IncomingMessage,
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage>
) => {
  if (
    typeof req.headers.host === "undefined" ||
    typeof proxyRes.headers["set-cookie"] === "undefined"
  ) {
    debug("No cookie to rewrite");
    return;
  }
  const { host } = req.headers;
  // We don't support rewrite domain or ip address
  // Only https -> http
  if (host !== targetHost || isHostAddressIp(host)) {
    debug("Not target host, skip cookie rewrite");
    return;
  }
  // if not https, remove secure flag.
  res.setHeader(
    "set-cookie",
    (proxyRes.headers["set-cookie"] ?? []).map((cookie) =>
      cookie
        // @TODO: support same site stuff
        // .replace(/ Domain=[^;]*;/gi, ` Domain=${host};`)
        .replace(/ Secure[^;]*;/gi, "")
        .replace(/ SameSite=None;/gi, "")
    )
  );

  debug(`Set-Cookie rewrite: ${res.getHeader("set-cookie")}`);
};

const rewriteReferer = (
  proxyReq: http.ClientRequest,
  req: http.IncomingMessage
) => {
  // ignore request without referer
  if (typeof req.headers.referer !== "string") return;
  const refererUrl = new URL(req.headers.referer);
  if (refererUrl.host !== targetHost) return;
  refererUrl.protocol = "https:";
  refererUrl.host = targetHost;
  debug(`Rewrite referer: ${req.headers.referer} -> ${refererUrl.href}`);
  proxyReq.setHeader("referer", refererUrl.href);
};

proxy.on("proxyReq", (proxyReq, req, res) => {
  proxyReq.setHeader("IMWEB-USER", "heungjun");
  proxyReq.setHeader("developer-console", "Y");
  proxyReq.removeHeader("accept-encoding");
});

proxy.on("proxyReq", rewriteReferer);

proxy.on(
  "proxyRes",
  responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    // debug("intercepted response", proxyRes.statusCode, proxyRes.headers);

    res.setHeader("x-unwrap-https-proxy", "true");
    res.setHeader("vary", "*");

    rewriteCookieDomain(proxyRes, req, res);
    return responseBuffer;
  })
);

// handle normal HTTP traffic
server.on("request", (req, res) => {
  debug("\ngot request", req.url);
  const {host: hostRequested} = new URL(req.url || "", `http://${req.headers.host}`);
  if (hostRequested === targetHost) {
    return proxy.web(req, res, {
      target: `https://${targetHost}`,
      selfHandleResponse: true,
      secure: false,
      cookieDomainRewrite: false,
    });
  }

  // Handle plain HTTP traffic without using proxy
  const { method, url, headers } = req;
  const options = {
    method,
    headers,
    host: req.headers.host,
    path: url,
    timeout: TIMEOUT,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("timeout", () => {
    count -= 1;
    debug(`request timeout: ${req.headers.host}`);
    res.end("Request timeout");
  });

  req.pipe(proxyReq);
});

// handle HTTPS traffic - if target host
server.on("connect", (req, socket, head) => {
  debug("\ngot CONNECT request", req.url);
  const [host, port] = req.url?.split(":") ?? [];
  if (!host || !port) {
    socket.end("HTTP/1.1 400 Bad Request\r\n");
    return;
  }
  if (host === targetHost) {
    debug("target host detected, and rewrite to http");
    socket.write(
      "HTTP/1.1 400 Target host detected, and rewrite to http\r\n\r\n"
    );
  }
  const conn = net.connect(+port || 443, host, () => {
    count += 1;
    debug("connected to", host, port);
    socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    conn.write(head);
    conn.pipe(socket);
    socket.pipe(conn);
  });
  conn.setTimeout(TIMEOUT);
  conn.on("timeout", () => {
    count -= 1;
    debug(`connection timeout: ${host}:${port}`);
    conn.end();
  });
});

process.on("uncaughtException", (err) => {
  // handle ECONNRESET error
  debug(`uncaughtException: ${err.name}, ${err.message}`);
});

// setInterval(() => {
//   debug("Current connections: ", count);
// },1000)

server.listen(3128, () => {
  console.log(
    "HTTP(s) proxy server listening on port %d",
    3128,
    server.address(),
    server.maxConnections,
    server.maxRequestsPerSocket
  );
});
