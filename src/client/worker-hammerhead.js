(function () {

  /******************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  /* global Reflect, Promise, SuppressedError, Symbol */

  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
  };

  function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
  }

  typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };

  // -------------------------------------------------------------
  // WARNING: this file is used by both the client and the server.
  // Do not use any browser or node-specific API!
  // -------------------------------------------------------------
  // NOTE: Some websites override the String.prototype.trim method. When we use this function
  // in our scripts, we expect it to have the default behavior. Therefore, in order to protect
  // ourselves from spoofing, we must use our own implementation. Also, we cannot use the
  // String.prototype.trim method because on the client-side it is the same in the top window and
  // an iframe window. The client code may override this method in the top window before the
  // iframe is initialized, so that the iframe will lose access to the native method.
  function trim (str) {
      return typeof str === 'string' ? str.replace(/(^\s+)|(\s+$)/g, '') : str;
  }

  // -------------------------------------------------------------
  var URL_RE = /^\s*([\w-]+?:)?(?:\/\/(?:([^/]+)@)?(([^/%?;#: ]{0,80000})(?::(\d+))?))?(.{0,80000}?)\s{0,100}$/;
  var PROTOCOL_RE = /^([\w-]+?:)(\/\/|[^\\/]|$)/;
  var PATH_AFTER_HOST_RE = /^\/([^/]+?)\/([\S\s]+)$/;
  var FILE_RE = /^file:/i;
  var SHORT_ORIGIN_RE = /^http(s)?:\/\//;
  var IS_SECURE_ORIGIN_RE = /^s\*/;
  var SUPPORTED_PROTOCOL_RE = /^(?:https?|file):/i;
  var HASH_RE = /^#/;
  var REQUEST_DESCRIPTOR_VALUES_SEPARATOR = '!';
  var REQUEST_DESCRIPTOR_SESSION_INFO_VALUES_SEPARATOR = '*';
  var TRAILING_SLASH_RE = /\/$/;
  var SPECIAL_BLANK_PAGE = 'about:blank';
  var SPECIAL_ERROR_PAGE = 'about:error';
  var SPECIAL_PAGES = [SPECIAL_BLANK_PAGE, SPECIAL_ERROR_PAGE];
  var HTTP_DEFAULT_PORT = '80';
  var HTTPS_DEFAULT_PORT = '443';
  var Credentials;
  (function (Credentials) {
      Credentials[Credentials["include"] = 0] = "include";
      Credentials[Credentials["sameOrigin"] = 1] = "sameOrigin";
      Credentials[Credentials["omit"] = 2] = "omit";
      Credentials[Credentials["unknown"] = 3] = "unknown";
  })(Credentials || (Credentials = {})); // eslint-disable-line no-shadow
  var SPECIAL_PAGE_DEST_RESOURCE_INFO = {
      protocol: 'about:',
      host: '',
      hostname: '',
      port: '',
      partAfterHost: '',
  };
  var RESOURCE_TYPES = [
      { name: 'isIframe', flag: 'i' },
      { name: 'isForm', flag: 'f' },
      { name: 'isScript', flag: 's' },
      { name: 'isEventSource', flag: 'e' },
      { name: 'isHtmlImport', flag: 'h' },
      { name: 'isWebSocket', flag: 'w' },
      { name: 'isServiceWorker', flag: 'c' },
      { name: 'isAjax', flag: 'a' },
      { name: 'isObject', flag: 'o' },
  ];
  function parseResourceType(resourceType) {
      var parsedResourceType = {};
      if (!resourceType)
          return parsedResourceType;
      for (var _i = 0, RESOURCE_TYPES_1 = RESOURCE_TYPES; _i < RESOURCE_TYPES_1.length; _i++) {
          var _a = RESOURCE_TYPES_1[_i], name_1 = _a.name, flag = _a.flag;
          if (resourceType.indexOf(flag) > -1)
              parsedResourceType[name_1] = true;
      }
      return parsedResourceType;
  }
  function getResourceTypeString(parsedResourceType) {
      if (!parsedResourceType)
          return null;
      var resourceType = '';
      for (var _i = 0, RESOURCE_TYPES_2 = RESOURCE_TYPES; _i < RESOURCE_TYPES_2.length; _i++) {
          var _a = RESOURCE_TYPES_2[_i], name_2 = _a.name, flag = _a.flag;
          if (parsedResourceType[name_2])
              resourceType += flag;
      }
      return resourceType || null;
  }
  function makeShortOrigin(origin) {
      return origin === 'null' ? '' : origin.replace(SHORT_ORIGIN_RE, function (_, secure) { return secure ? 's*' : ''; });
  }
  function restoreShortOrigin(origin) {
      if (!origin)
          return 'null';
      return IS_SECURE_ORIGIN_RE.test(origin) ? origin.replace(IS_SECURE_ORIGIN_RE, 'https://') : 'http://' + origin;
  }
  function sameOriginCheck$1(location, checkedUrl) {
      if (!checkedUrl)
          return true;
      var parsedCheckedUrl = parseUrl$1(checkedUrl);
      var isRelative = !parsedCheckedUrl.host;
      if (isRelative)
          return true;
      var parsedLocation = parseUrl$1(location);
      var parsedProxyLocation = parseProxyUrl$1(location);
      if (parsedCheckedUrl.host === parsedLocation.host && parsedCheckedUrl.protocol === parsedLocation.protocol)
          return true;
      var parsedDestUrl = parsedProxyLocation ? parsedProxyLocation.destResourceInfo : parsedLocation;
      if (!parsedDestUrl)
          return false;
      var isSameProtocol = !parsedCheckedUrl.protocol || parsedCheckedUrl.protocol === parsedDestUrl.protocol;
      var portsEq = !parsedDestUrl.port && !parsedCheckedUrl.port ||
          parsedDestUrl.port && parsedDestUrl.port.toString() === parsedCheckedUrl.port;
      return isSameProtocol && !!portsEq && parsedDestUrl.hostname === parsedCheckedUrl.hostname;
  }
  // NOTE: Convert the destination protocol and hostname to the lower case. (GH-1)
  function convertHostToLowerCase(url) {
      var parsedUrl = parseUrl$1(url);
      parsedUrl.protocol = parsedUrl.protocol && parsedUrl.protocol.toLowerCase();
      parsedUrl.host = parsedUrl.host && parsedUrl.host.toLowerCase();
      return formatUrl(parsedUrl);
  }
  function getURLString(url) {
      // TODO: fix it
      // eslint-disable-next-line no-undef
      if (url === null && /iPad|iPhone/i.test(window.navigator.userAgent))
          return '';
      return String(url).replace(/[\n\t]/g, '');
  }
  function getProxyUrl$1(url, opts) {
      var sessionInfo = [opts.sessionId];
      if (opts.windowId)
          sessionInfo.push(opts.windowId);
      var params = [sessionInfo.join(REQUEST_DESCRIPTOR_SESSION_INFO_VALUES_SEPARATOR)];
      if (opts.resourceType)
          params.push(opts.resourceType);
      if (opts.charset)
          params.push(opts.charset.toLowerCase());
      if (typeof opts.credentials === 'number')
          params.push(opts.credentials.toString());
      if (opts.reqOrigin)
          params.push(encodeURIComponent(makeShortOrigin(opts.reqOrigin)));
      var descriptor = params.join(REQUEST_DESCRIPTOR_VALUES_SEPARATOR);
      var proxyProtocol = opts.proxyProtocol || 'http:';
      return "".concat(proxyProtocol, "//").concat(opts.proxyHostname, ":").concat(opts.proxyPort, "/").concat(descriptor, "/").concat(convertHostToLowerCase(url));
  }
  function getDomain(parsed) {
      if (parsed.protocol === 'file:')
          return 'null';
      return formatUrl({
          protocol: parsed.protocol,
          host: parsed.host,
          hostname: parsed.hostname,
          port: String(parsed.port || ''),
      });
  }
  function parseRequestDescriptor(desc) {
      var _a = desc.split(REQUEST_DESCRIPTOR_VALUES_SEPARATOR), sessionInfo = _a[0], resourceType = _a[1], resourceData = _a.slice(2);
      if (!sessionInfo)
          return null;
      var _b = sessionInfo.split(REQUEST_DESCRIPTOR_SESSION_INFO_VALUES_SEPARATOR), sessionId = _b[0], windowId = _b[1];
      var parsedDesc = { sessionId: sessionId, resourceType: resourceType || null };
      if (windowId)
          parsedDesc.windowId = windowId;
      if (resourceType && resourceData.length) {
          var parsedResourceType = parseResourceType(resourceType);
          if (parsedResourceType.isScript || parsedResourceType.isServiceWorker)
              parsedDesc.charset = resourceData[0];
          else if (parsedResourceType.isWebSocket)
              parsedDesc.reqOrigin = decodeURIComponent(restoreShortOrigin(resourceData[0]));
          else if (parsedResourceType.isIframe && resourceData[0])
              parsedDesc.reqOrigin = decodeURIComponent(restoreShortOrigin(resourceData[0]));
          else if (parsedResourceType.isAjax) {
              parsedDesc.credentials = parseInt(resourceData[0], 10);
              if (resourceData.length === 2)
                  parsedDesc.reqOrigin = decodeURIComponent(restoreShortOrigin(resourceData[1]));
          }
      }
      return parsedDesc;
  }
  function parseProxyUrl$1(proxyUrl) {
      // TODO: Remove it.
      var parsedUrl = parseUrl$1(proxyUrl);
      if (!parsedUrl.partAfterHost)
          return null;
      var match = parsedUrl.partAfterHost.match(PATH_AFTER_HOST_RE);
      if (!match)
          return null;
      var parsedDesc = parseRequestDescriptor(match[1]);
      // NOTE: We should have, at least, the job uid and the owner token.
      if (!parsedDesc)
          return null;
      var destUrl = match[2];
      // Browser can redirect to a special page with hash (GH-1671)
      var destUrlWithoutHash = destUrl.replace(/#[\S\s]*$/, '');
      if (!isSpecialPage$1(destUrlWithoutHash) && !SUPPORTED_PROTOCOL_RE.test(destUrl))
          return null;
      var destResourceInfo;
      if (isSpecialPage$1(destUrlWithoutHash))
          destResourceInfo = SPECIAL_PAGE_DEST_RESOURCE_INFO;
      else {
          destUrl = omitDefaultPort(destUrl);
          destResourceInfo = parseUrl$1(destUrl);
      }
      return {
          destUrl: destUrl,
          destResourceInfo: destResourceInfo,
          partAfterHost: parsedUrl.partAfterHost,
          proxy: {
              hostname: parsedUrl.hostname || '',
              port: parsedUrl.port || '',
          },
          sessionId: parsedDesc.sessionId,
          resourceType: parsedDesc.resourceType,
          charset: parsedDesc.charset,
          reqOrigin: parsedDesc.reqOrigin,
          windowId: parsedDesc.windowId,
          credentials: parsedDesc.credentials,
      };
  }
  function parseUrl$1(url) {
      url = processSpecialChars(url);
      if (!url)
          return {};
      var urlMatch = url.match(URL_RE);
      return urlMatch ? {
          protocol: urlMatch[1],
          auth: urlMatch[2],
          host: urlMatch[3],
          hostname: urlMatch[4],
          port: urlMatch[5],
          partAfterHost: urlMatch[6],
      } : {};
  }
  function isSupportedProtocol$1(url) {
      url = trim(url || '');
      var isHash = HASH_RE.test(url);
      if (isHash)
          return false;
      var protocol = url.match(PROTOCOL_RE);
      if (!protocol)
          return true;
      return SUPPORTED_PROTOCOL_RE.test(protocol[0]);
  }
  function resolveUrlAsDest$1(url, getProxyUrlMeth, isUrlsSet) {
      if (isUrlsSet === void 0) { isUrlsSet = false; }
      if (isUrlsSet)
          return handleUrlsSet(resolveUrlAsDest$1, url, getProxyUrlMeth);
      getProxyUrlMeth = getProxyUrlMeth || getProxyUrl$1;
      if (isSupportedProtocol$1(url)) {
          var proxyUrl = getProxyUrlMeth(url);
          var parsedProxyUrl = parseProxyUrl$1(proxyUrl);
          return parsedProxyUrl ? formatUrl(parsedProxyUrl.destResourceInfo) : url;
      }
      return url;
  }
  function formatUrl(parsedUrl) {
      // NOTE: the URL is relative.
      if (parsedUrl.protocol !== 'file:' && parsedUrl.protocol !== 'about:' &&
          !parsedUrl.host && (!parsedUrl.hostname || !parsedUrl.port))
          return parsedUrl.partAfterHost || '';
      var url = parsedUrl.protocol || '';
      if (parsedUrl.protocol !== 'about:')
          url += '//';
      if (parsedUrl.auth)
          url += parsedUrl.auth + '@';
      if (parsedUrl.host)
          url += parsedUrl.host;
      else if (parsedUrl.hostname) {
          url += parsedUrl.hostname;
          if (parsedUrl.port)
              url += ':' + parsedUrl.port;
      }
      if (parsedUrl.partAfterHost)
          url += parsedUrl.partAfterHost;
      return url;
  }
  function handleUrlsSet(handler, url) {
      var args = [];
      for (var _i = 2; _i < arguments.length; _i++) {
          args[_i - 2] = arguments[_i];
      }
      var resourceUrls = url.split(',');
      var replacedUrls = [];
      for (var _a = 0, resourceUrls_1 = resourceUrls; _a < resourceUrls_1.length; _a++) {
          var fullUrlStr = resourceUrls_1[_a];
          var _b = fullUrlStr.replace(/ +/g, ' ').trim().split(' '), urlStr = _b[0], postUrlStr = _b[1];
          if (urlStr) {
              var replacedUrl = handler.apply(void 0, __spreadArray([urlStr], args, false));
              replacedUrls.push(replacedUrl + (postUrlStr ? " ".concat(postUrlStr) : ''));
          }
      }
      return replacedUrls.join(',');
  }
  function correctMultipleSlashes(url, pageProtocol) {
      if (pageProtocol === void 0) { pageProtocol = ''; }
      // NOTE: Remove unnecessary slashes from the beginning of the url and after scheme.
      // For example:
      // "//////example.com" -> "//example.com" (scheme-less HTTP(S) URL)
      // "////home/testcafe/documents" -> "///home/testcafe/documents" (scheme-less unix file URL)
      // "http:///example.com" -> "http://example.com"
      //
      // And add missing slashes after the file scheme.
      // "file://C:/document.txt" -> "file:///C:/document.txt"
      if (url.match(FILE_RE) || pageProtocol.match(FILE_RE)) {
          return url
              .replace(/^(file:)?\/{1,100}(\/\/\/.*$)/i, '$1$2')
              .replace(/^(file:)?\/*([A-Za-z]):/i, '$1///$2:');
      }
      return url.replace(/^(https?:)?\/{1,100}(\/\/.*$)/i, '$1$2');
  }
  function processSpecialChars(url) {
      return correctMultipleSlashes(getURLString(url));
  }
  function ensureTrailingSlash(srcUrl, processedUrl) {
      if (!isValidUrl(processedUrl))
          return processedUrl;
      var srcUrlEndsWithTrailingSlash = TRAILING_SLASH_RE.test(srcUrl);
      var processedUrlEndsWithTrailingSlash = TRAILING_SLASH_RE.test(processedUrl);
      if (srcUrlEndsWithTrailingSlash && !processedUrlEndsWithTrailingSlash)
          processedUrl += '/';
      else if (srcUrl && !srcUrlEndsWithTrailingSlash && processedUrlEndsWithTrailingSlash)
          processedUrl = processedUrl.replace(TRAILING_SLASH_RE, '');
      return processedUrl;
  }
  function isSpecialPage$1(url) {
      return SPECIAL_PAGES.indexOf(url) !== -1;
  }
  function isValidPort(port) {
      var parsedPort = parseInt(port, 10);
      return parsedPort > 0 && parsedPort <= 65535;
  }
  function isValidUrl(url) {
      var parsedUrl = parseUrl$1(url);
      return parsedUrl.protocol === 'file:' || parsedUrl.protocol === 'about:' ||
          !!parsedUrl.hostname && (!parsedUrl.port || isValidPort(parsedUrl.port));
  }
  function omitDefaultPort(url) {
      // NOTE: If you request an url containing default port
      // then browser remove this one itself.
      var parsedUrl = parseUrl$1(url);
      var hasDefaultPort = parsedUrl.protocol === 'https:' && parsedUrl.port === HTTPS_DEFAULT_PORT ||
          parsedUrl.protocol === 'http:' && parsedUrl.port === HTTP_DEFAULT_PORT;
      if (hasDefaultPort) {
          parsedUrl.host = parsedUrl.hostname;
          parsedUrl.port = '';
          return formatUrl(parsedUrl);
      }
      return url;
  }

  // -------------------------------------------------------------
  // WARNING: this file is used by both the client and the server.
  // Do not use any browser or node-specific API!
  // -------------------------------------------------------------
  var INTERNAL_PROPS = {
      processDomMethodName: 'hammerhead|process-dom-method',
      processedContext: 'hammerhead|processed-context',
      documentWasCleaned: 'hammerhead|document-was-cleaned',
      documentCharset: 'hammerhead|document-charset',
      iframeNativeMethods: 'hammerhead|iframe-native-methods',
      hammerhead: '%hammerhead%',
      selection: 'hammerhead|selection',
      shadowUIElement: 'hammerhead|shadow-ui-element',
      forceProxySrcForImage: 'hammerhead|image|force-proxy-src-flag',
      skipNextLoadEventForImage: 'hammerhead|image|skip-next-load-event-flag',
      cachedImage: 'hammerhead|image|cached-image',
      sandboxIsReattached: 'hammerhead|sandbox-is-reattached',
      nativeStrRepresentation: 'hammerhead|native-string-representation',
      currentBaseUrl: 'hammerhead|current-base-url',
  };

  // -------------------------------------------------------------
  // WARNING: this file is used by both the client and the server.
  // Do not use any browser or node-specific API!
  // -------------------------------------------------------------
  var INTERNAL_ATTRS = {
      storedAttrPostfix: '-hammerhead-stored-value',
      hoverPseudoClass: 'data-hammerhead-hovered',
      focusPseudoClass: 'data-hammerhead-focused',
      uploadInfoHiddenInputName: 'hammerhead|upload-info-hidden-input-name',
  };

  var isInWorker = typeof window === 'undefined' && typeof self === 'object';
  var global$1 = (isInWorker ? self : window);
  var globalContextInfo = {
      isInWorker: isInWorker,
      global: global$1,
      isServiceWorker: isInWorker && !global$1.XMLHttpRequest,
  };

  function replaceNativeAccessor(descriptor, accessorName, newAccessor) {
      if (newAccessor && descriptor[accessorName]) {
          var stringifiedNativeAccessor_1 = descriptor[accessorName].toString();
          newAccessor.toString = function () { return stringifiedNativeAccessor_1; };
      }
      descriptor[accessorName] = newAccessor;
  }
  function createOverriddenDescriptor(obj, prop, _a) {
      var getter = _a.getter, setter = _a.setter, value = _a.value;
      var descriptor = nativeMethods.objectGetOwnPropertyDescriptor(obj, prop);
      if ((getter || setter) && value)
          throw new Error('Cannot both specify accessors and a value or writable attribute.');
      if (!descriptor)
          return void 0;
      if (value) {
          if (!nativeMethods.objectHasOwnProperty.call(descriptor, 'writable')) {
              descriptor.writable = !!descriptor.set;
              delete descriptor.get;
              delete descriptor.set;
          }
          descriptor.value = value; // eslint-disable-line no-restricted-properties
      }
      else {
          if (nativeMethods.objectHasOwnProperty.call(descriptor, 'writable')) {
              delete descriptor.value; // eslint-disable-line no-restricted-properties
              delete descriptor.writable;
          }
          if (getter !== null)
              replaceNativeAccessor(descriptor, 'get', getter);
          if (setter !== null)
              replaceNativeAccessor(descriptor, 'set', setter);
      }
      return descriptor;
  }
  function overrideDescriptor(obj, prop, propertyAccessors) {
      if (!obj)
          return;
      var descriptor = createOverriddenDescriptor(obj, prop, propertyAccessors);
      if (descriptor)
          nativeMethods.objectDefineProperty(obj, prop, descriptor);
      else
          overrideDescriptor(nativeMethods.objectGetPrototypeOf(obj), prop, propertyAccessors);
  }
  function overrideFunctionName(fn, name) {
      var nameDescriptor = nativeMethods.objectGetOwnPropertyDescriptor(fn, 'name');
      if (!nameDescriptor)
          return;
      nameDescriptor.value = name; // eslint-disable-line no-restricted-properties
      nativeMethods.objectDefineProperty(fn, 'name', nameDescriptor);
  }
  function overrideToString(nativeFnWrapper, nativeFn) {
      nativeMethods.objectDefineProperty(nativeFnWrapper, INTERNAL_PROPS.nativeStrRepresentation, {
          value: nativeMethods.Function.prototype.toString.call(nativeFn),
          configurable: true,
      });
  }
  // TODO: this function should not be used outside this file
  // for now it's used to flag cases in which we assign our wrapper to a native function when it is missing
  function overrideStringRepresentation(nativeFnWrapper, nativeFn) {
      overrideFunctionName(nativeFnWrapper, nativeFn.name);
      overrideToString(nativeFnWrapper, nativeFn);
  }
  function isNativeFunction(fn) {
      return !nativeMethods.objectHasOwnProperty.call(fn, INTERNAL_PROPS.nativeStrRepresentation);
  }
  function overrideFunction(obj, fnName, wrapper) {
      var fn = obj[fnName];
      if (isNativeFunction(fn)) {
          overrideStringRepresentation(wrapper, fn);
          obj[fnName] = wrapper;
      }
  }
  function overrideConstructor(obj, fnName, wrapper, overrideProtoConstructor) {
      if (overrideProtoConstructor === void 0) { overrideProtoConstructor = false; }
      var nativePrototype = obj[fnName]['prototype'];
      overrideFunction(obj, fnName, wrapper);
      // NOTE: restore native prototype (to make `instanceof` work as expected)
      wrapper.prototype = nativePrototype;
      // NOTE: we need to override the `constructor` property of a prototype
      // because sometimes native constructor can be retrieved from it
      if (overrideProtoConstructor)
          nativePrototype.constructor = wrapper;
  }

  /*global Document, Window */
  var NATIVE_CODE_RE = /\[native code]/;
  var NativeMethods = /** @class */ (function () {
      function NativeMethods(doc, win) {
          win = win || globalContextInfo.global;
          this.refreshWindowMeths(win, globalContextInfo.isInWorker);
          this.refreshWorkerMeths(win);
          if (globalContextInfo.isInWorker)
              return;
          this.refreshDocumentMeths(doc, win);
          this.refreshElementMeths(doc, win);
      }
      NativeMethods._getDocumentPropOwnerName = function (docPrototype, propName) {
          return docPrototype.hasOwnProperty(propName) ? 'Document' : 'HTMLDocument'; // eslint-disable-line no-prototype-builtins
      };
      NativeMethods.prototype.refreshWorkerMeths = function (scope /* WorkerGlobalScope */) {
          this.importScripts = scope.importScripts;
      };
      NativeMethods.prototype.refreshDocumentMeths = function (doc, win) {
          doc = doc || document;
          win = win || window;
          var docPrototype = win.Document.prototype;
          // Dom
          this.createDocumentFragment = docPrototype.createDocumentFragment;
          this.createElement = docPrototype.createElement;
          this.createElementNS = docPrototype.createElementNS;
          this.createTextNode = docPrototype.createTextNode;
          this.documentOpenPropOwnerName = NativeMethods._getDocumentPropOwnerName(docPrototype, 'open');
          this.documentClosePropOwnerName = NativeMethods._getDocumentPropOwnerName(docPrototype, 'close');
          this.documentWritePropOwnerName = NativeMethods._getDocumentPropOwnerName(docPrototype, 'write');
          this.documentWriteLnPropOwnerName = NativeMethods._getDocumentPropOwnerName(docPrototype, 'writeln');
          this.documentOpen = win[this.documentOpenPropOwnerName].prototype.open;
          this.documentClose = win[this.documentClosePropOwnerName].prototype.close;
          this.documentWrite = win[this.documentWritePropOwnerName].prototype.write;
          this.documentWriteLn = win[this.documentWriteLnPropOwnerName].prototype.writeln;
          this.elementFromPoint = docPrototype.elementFromPoint;
          this.caretRangeFromPoint = docPrototype.caretRangeFromPoint;
          // @ts-ignore Experimental method in Firefox
          this.caretPositionFromPoint = docPrototype.caretPositionFromPoint;
          this.getElementById = docPrototype.getElementById;
          this.getElementsByClassName = docPrototype.getElementsByClassName;
          this.getElementsByName = docPrototype.getElementsByName;
          this.getElementsByTagName = docPrototype.getElementsByTagName;
          this.querySelector = docPrototype.querySelector;
          this.querySelectorAll = docPrototype.querySelectorAll;
          this.createHTMLDocument = win.DOMImplementation.prototype.createHTMLDocument;
          // @ts-ignore
          if (doc.registerElement) {
              // @ts-ignore
              this.registerElement = docPrototype.registerElement;
          }
          // Event
          this.documentAddEventListener = docPrototype.addEventListener;
          this.documentRemoveEventListener = docPrototype.removeEventListener;
          this.documentCreateEvent = docPrototype.createEvent;
          // @ts-ignore Deprecated
          this.documentCreateTouch = docPrototype.createTouch;
          // @ts-ignore Deprecated
          this.documentCreateTouchList = docPrototype.createTouchList;
          // getters/setters
          this.documentCookiePropOwnerName = NativeMethods._getDocumentPropOwnerName(docPrototype, 'cookie');
          var documentCookieDescriptor = win.Object.getOwnPropertyDescriptor(win[this.documentCookiePropOwnerName].prototype, 'cookie');
          // TODO: remove this condition after the GH-1649 fix
          if (!this.isNativeCode(documentCookieDescriptor.get) ||
              !this.isNativeCode(documentCookieDescriptor.get.toString)) {
              try {
                  var parentNativeMethods = win.parent['%hammerhead%'].nativeMethods;
                  documentCookieDescriptor.get = parentNativeMethods.documentCookieGetter;
                  documentCookieDescriptor.set = parentNativeMethods.documentCookieSetter;
              }
              catch (_a) { } // eslint-disable-line no-empty
          }
          this.documentReferrerGetter = win.Object.getOwnPropertyDescriptor(docPrototype, 'referrer').get;
          this.documentStyleSheetsGetter = win.Object.getOwnPropertyDescriptor(docPrototype, 'styleSheets').get;
          this.documentActiveElementGetter = win.Object.getOwnPropertyDescriptor(docPrototype, 'activeElement').get;
          this.documentCookieGetter = documentCookieDescriptor.get;
          this.documentCookieSetter = documentCookieDescriptor.set;
          var documentDocumentURIDescriptor = win.Object.getOwnPropertyDescriptor(docPrototype, 'documentURI');
          if (documentDocumentURIDescriptor)
              this.documentDocumentURIGetter = documentDocumentURIDescriptor.get;
          var documentTitleDescriptor = win.Object.getOwnPropertyDescriptor(docPrototype, 'title');
          this.documentTitleGetter = documentTitleDescriptor.get;
          this.documentTitleSetter = documentTitleDescriptor.set;
      };
      NativeMethods.prototype.refreshElementMeths = function (doc, win) {
          var _this = this;
          win = win || window;
          var createElement = (function (tagName) { return _this.createElement.call(doc || document, tagName); });
          var nativeElement = createElement('div');
          var createTextNode = function (data) { return _this.createTextNode.call(doc || document, data); };
          var textNode = createTextNode('text');
          // Dom
          this.appendChild = win.Node.prototype.appendChild;
          this.append = win.Element.prototype.append;
          this.prepend = win.Element.prototype.prepend;
          this.after = win.Element.prototype.after;
          this.attachShadow = win.Element.prototype.attachShadow;
          this.replaceChild = nativeElement.replaceChild;
          this.cloneNode = nativeElement.cloneNode;
          this.elementGetElementsByClassName = nativeElement.getElementsByClassName;
          this.elementGetElementsByTagName = nativeElement.getElementsByTagName;
          this.elementQuerySelector = nativeElement.querySelector;
          this.elementQuerySelectorAll = nativeElement.querySelectorAll;
          this.getAttribute = nativeElement.getAttribute;
          this.getAttributeNS = nativeElement.getAttributeNS;
          this.getAttributeNode = nativeElement.getAttributeNode;
          this.getAttributeNodeNS = nativeElement.getAttributeNodeNS;
          this.insertBefore = nativeElement.insertBefore;
          this.insertCell = createElement('tr').insertCell;
          this.insertTableRow = createElement('table').insertRow;
          this.insertTBodyRow = createElement('tbody').insertRow;
          this.removeAttribute = nativeElement.removeAttribute;
          this.removeAttributeNS = nativeElement.removeAttributeNS;
          this.removeAttributeNode = nativeElement.removeAttributeNode;
          this.removeChild = win.Node.prototype.removeChild;
          this.remove = win.Element.prototype.remove;
          this.elementReplaceWith = win.Element.prototype.replaceWith;
          this.setAttribute = nativeElement.setAttribute;
          this.setAttributeNS = nativeElement.setAttributeNS;
          this.hasAttribute = nativeElement.hasAttribute;
          this.hasAttributeNS = nativeElement.hasAttributeNS;
          this.hasAttributes = nativeElement.hasAttributes;
          this.anchorToString = win.HTMLAnchorElement.prototype.toString;
          this.matches = nativeElement.matches;
          this.closest = nativeElement.closest;
          this.insertAdjacentElement = win.Element.prototype.insertAdjacentElement;
          this.insertAdjacentHTML = win.Element.prototype.insertAdjacentHTML;
          this.insertAdjacentText = win.Element.prototype.insertAdjacentText;
          // Text node
          this.appendData = textNode.appendData;
          // TODO: remove this condition after the GH-1649 fix
          if (!this.isNativeCode(this.elementGetElementsByTagName)) {
              try {
                  var parentNativeMethods = win.parent['%hammerhead%'].nativeMethods;
                  this.elementGetElementsByTagName = parentNativeMethods.elementGetElementsByTagName;
              }
              // eslint-disable-next-line no-empty
              catch (e) {
              }
          }
          // Event
          this.addEventListener = win.EventTarget.prototype.addEventListener;
          this.removeEventListener = win.EventTarget.prototype.removeEventListener;
          this.dispatchEvent = win.EventTarget.prototype.dispatchEvent;
          this.blur = nativeElement.blur;
          this.click = nativeElement.click;
          this.focus = nativeElement.focus;
          // @ts-ignore
          this.select = window.TextRange ? createElement('body').createTextRange().select : null;
          this.setSelectionRange = createElement('input').setSelectionRange;
          this.textAreaSetSelectionRange = createElement('textarea').setSelectionRange;
          this.svgFocus = win.SVGElement ? win.SVGElement.prototype.focus : this.focus;
          this.svgBlur = win.SVGElement ? win.SVGElement.prototype.blur : this.blur;
          // Style
          // NOTE: The 'style' descriptor is located in the Element.prototype in the Safari on IOS
          this.htmlElementStylePropOwnerName = win.Element.prototype.hasOwnProperty('style') ? 'Element' : 'HTMLElement'; // eslint-disable-line no-prototype-builtins
          var htmlElementStyleDescriptor = win.Object.getOwnPropertyDescriptor(win[this.htmlElementStylePropOwnerName].prototype, 'style');
          this.htmlElementStyleGetter = htmlElementStyleDescriptor.get;
          this.htmlElementStyleSetter = htmlElementStyleDescriptor.set;
          var styleCssTextDescriptor = win.Object.getOwnPropertyDescriptor(win.CSSStyleDeclaration.prototype, 'cssText');
          this.styleCssTextGetter = styleCssTextDescriptor.get;
          this.styleCssTextSetter = styleCssTextDescriptor.set;
      };
      NativeMethods.prototype._refreshGettersAndSetters = function (win, isInWorker) {
          if (isInWorker === void 0) { isInWorker = false; }
          win = win || window;
          var winOnBeforeUnloadDescriptor = win.Object.getOwnPropertyDescriptor(win, 'onbeforeunload');
          var winOnUnloadDescriptor = win.Object.getOwnPropertyDescriptor(win, 'onunload');
          var winOnPageHideDescriptor = win.Object.getOwnPropertyDescriptor(win, 'onpagehide');
          var winOnMessageDescriptor = win.Object.getOwnPropertyDescriptor(win, 'onmessage');
          var winOnErrorDescriptor = win.Object.getOwnPropertyDescriptor(win, 'onerror');
          var winOnHashChangeDescriptor = win.Object.getOwnPropertyDescriptor(win, 'onhashchange');
          this.winOnBeforeUnloadSetter = winOnBeforeUnloadDescriptor && winOnBeforeUnloadDescriptor.set;
          this.winOnUnloadSetter = winOnUnloadDescriptor && winOnUnloadDescriptor.set;
          this.winOnPageHideSetter = winOnPageHideDescriptor && winOnPageHideDescriptor.set;
          this.winOnMessageSetter = winOnMessageDescriptor && winOnMessageDescriptor.set;
          this.winOnErrorSetter = winOnErrorDescriptor && winOnErrorDescriptor.set;
          this.winOnHashChangeSetter = winOnHashChangeDescriptor && winOnHashChangeDescriptor.set;
          var winOnUnhandledRejectionDescriptor = win.Object.getOwnPropertyDescriptor(win, 'onunhandledrejection');
          if (winOnUnhandledRejectionDescriptor)
              this.winOnUnhandledRejectionSetter = winOnUnhandledRejectionDescriptor.set;
          // Getters
          if (win.WebSocket) {
              var urlPropDescriptor = win.Object.getOwnPropertyDescriptor(win.WebSocket.prototype, 'url');
              if (urlPropDescriptor && urlPropDescriptor.get && urlPropDescriptor.configurable)
                  this.webSocketUrlGetter = urlPropDescriptor.get;
          }
          this.messageEventOriginGetter = win.Object.getOwnPropertyDescriptor(win.MessageEvent.prototype, 'origin').get;
          // NOTE: At present we proxy only the PerformanceNavigationTiming.
          // Another types of the PerformanceEntry will be fixed later
          // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEntry
          if (win.PerformanceNavigationTiming)
              this.performanceEntryNameGetter = win.Object.getOwnPropertyDescriptor(win.PerformanceEntry.prototype, 'name').get;
          var dataPropDescriptor = win.Object.getOwnPropertyDescriptor(win.MessageEvent.prototype, 'data');
          // NOTE: This condition is used for the Android 6.0 browser
          if (dataPropDescriptor)
              this.messageEventDataGetter = dataPropDescriptor.get;
          if (win.fetch) {
              this.responseStatusGetter = win.Object.getOwnPropertyDescriptor(win.Response.prototype, 'status').get;
              this.responseTypeGetter = win.Object.getOwnPropertyDescriptor(win.Response.prototype, 'type').get;
              this.responseUrlGetter = win.Object.getOwnPropertyDescriptor(win.Response.prototype, 'url').get;
              this.requestUrlGetter = win.Object.getOwnPropertyDescriptor(win.Request.prototype, 'url').get;
              this.requestReferrerGetter = win.Object.getOwnPropertyDescriptor(win.Request.prototype, 'referrer').get;
          }
          if (win.XMLHttpRequest)
              this.xhrResponseURLGetter = win.Object.getOwnPropertyDescriptor(win.XMLHttpRequest.prototype, 'responseURL').get;
          if (win.Window) {
              this.winLocalStorageGetter = win.Object.getOwnPropertyDescriptor(win, 'localStorage').get;
              this.winSessionStorageGetter = win.Object.getOwnPropertyDescriptor(win, 'sessionStorage').get;
          }
          if (isInWorker)
              return;
          this.storageGetItem = win.Storage.prototype.getItem;
          this.storageSetItem = win.Storage.prototype.setItem;
          this.storageRemoveItem = win.Storage.prototype.removeItem;
          this.storageClear = win.Storage.prototype.clear;
          this.storageKey = win.Storage.prototype.key;
          this.storageLengthGetter = win.Object.getOwnPropertyDescriptor(win.Storage.prototype, 'length');
          var objectDataDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLObjectElement.prototype, 'data');
          var inputTypeDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'type');
          var inputValueDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value');
          var inputDisabledDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'disabled');
          var inputRequiredDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'required');
          var textAreaValueDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, 'value');
          var imageSrcDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLImageElement.prototype, 'src');
          var imageSrcsetDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLImageElement.prototype, 'srcset');
          var scriptSrcDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLScriptElement.prototype, 'src');
          var scriptIntegrityDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLScriptElement.prototype, 'integrity');
          var embedSrcDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLEmbedElement.prototype, 'src');
          var sourceSrcDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLSourceElement.prototype, 'src');
          var mediaSrcDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLMediaElement.prototype, 'src');
          var inputSrcDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'src');
          var frameSrcDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLFrameElement.prototype, 'src');
          var iframeSrcDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLIFrameElement.prototype, 'src');
          var anchorHrefDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLAnchorElement.prototype, 'href');
          var linkHrefDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLLinkElement.prototype, 'href');
          var linkIntegrityDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLLinkElement.prototype, 'integrity');
          var linkRelDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLLinkElement.prototype, 'rel');
          var linkAsDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLLinkElement.prototype, 'as');
          var areaHrefDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLAreaElement.prototype, 'href');
          var baseHrefDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLBaseElement.prototype, 'href');
          var anchorHostDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLAnchorElement.prototype, 'host');
          var anchorHostnameDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLAnchorElement.prototype, 'hostname');
          var anchorPathnameDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLAnchorElement.prototype, 'pathname');
          var anchorPortDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLAnchorElement.prototype, 'port');
          var anchorProtocolDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLAnchorElement.prototype, 'protocol');
          var anchorSearchDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLAnchorElement.prototype, 'search');
          var anchorTargetDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLAnchorElement.prototype, 'target');
          var formTargetDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLFormElement.prototype, 'target');
          var areaTargetDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLAreaElement.prototype, 'target');
          var baseTargetDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLBaseElement.prototype, 'target');
          var inputFormTargetDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'formTarget');
          var buttonFormTargetDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLButtonElement.prototype, 'formTarget');
          var svgImageHrefDescriptor = win.Object.getOwnPropertyDescriptor(win.SVGImageElement.prototype, 'href');
          var svgAnimStrAnimValDescriptor = win.Object.getOwnPropertyDescriptor(win.SVGAnimatedString.prototype, 'animVal');
          var svgAnimStrBaseValDescriptor = win.Object.getOwnPropertyDescriptor(win.SVGAnimatedString.prototype, 'baseVal');
          var inputAutocompleteDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'autocomplete');
          var formActionDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLFormElement.prototype, 'action');
          var inputFormActionDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'formAction');
          var buttonFormActionDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLButtonElement.prototype, 'formAction');
          var nodeTextContentDescriptor = win.Object.getOwnPropertyDescriptor(win.Node.prototype, 'textContent');
          var htmlElementInnerTextDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLElement.prototype, 'innerText');
          var scriptTextDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLScriptElement.prototype, 'text');
          var anchorTextDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLAnchorElement.prototype, 'text');
          var titleElementTextDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLTitleElement.prototype, 'text');
          var iframeSandboxDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLIFrameElement.prototype, 'sandbox');
          var metaHttpEquivDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLMetaElement.prototype, 'httpEquiv');
          var windowOriginDescriptor = win.Object.getOwnPropertyDescriptor(win, 'origin');
          var iframeSrcdocDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLIFrameElement.prototype, 'srcdoc');
          if (windowOriginDescriptor) {
              this.windowOriginGetter = windowOriginDescriptor.get;
              this.windowOriginSetter = windowOriginDescriptor.set;
          }
          this.inputDisabledSetter = inputDisabledDescriptor.set;
          this.inputDisabledGetter = inputDisabledDescriptor.get;
          var elementInnerHTMLDescriptor = win.Object.getOwnPropertyDescriptor(win.Element.prototype, 'innerHTML');
          var elementOuterHTMLDescriptor = win.Object.getOwnPropertyDescriptor(win.Element.prototype, 'outerHTML');
          // Setters
          this.objectDataSetter = objectDataDescriptor.set;
          this.inputTypeSetter = inputTypeDescriptor.set;
          this.inputValueSetter = inputValueDescriptor.set;
          this.inputRequiredSetter = inputRequiredDescriptor.set;
          this.textAreaValueSetter = textAreaValueDescriptor.set;
          this.imageSrcSetter = imageSrcDescriptor.set;
          this.scriptSrcSetter = scriptSrcDescriptor.set;
          this.embedSrcSetter = embedSrcDescriptor.set;
          this.sourceSrcSetter = sourceSrcDescriptor.set;
          this.mediaSrcSetter = mediaSrcDescriptor.set;
          this.inputSrcSetter = inputSrcDescriptor.set;
          this.frameSrcSetter = frameSrcDescriptor.set;
          this.iframeSrcSetter = iframeSrcDescriptor.set;
          this.anchorHrefSetter = anchorHrefDescriptor.set;
          this.linkHrefSetter = linkHrefDescriptor.set;
          this.linkRelSetter = linkRelDescriptor.set;
          this.linkAsSetter = linkAsDescriptor && linkAsDescriptor.set;
          this.areaHrefSetter = areaHrefDescriptor.set;
          this.baseHrefSetter = baseHrefDescriptor.set;
          this.anchorHostSetter = anchorHostDescriptor.set;
          this.anchorHostnameSetter = anchorHostnameDescriptor.set;
          this.anchorPathnameSetter = anchorPathnameDescriptor.set;
          this.anchorPortSetter = anchorPortDescriptor.set;
          this.anchorProtocolSetter = anchorProtocolDescriptor.set;
          this.anchorSearchSetter = anchorSearchDescriptor.set;
          this.anchorTargetSetter = anchorTargetDescriptor.set;
          this.formTargetSetter = formTargetDescriptor.set;
          this.areaTargetSetter = areaTargetDescriptor.set;
          this.baseTargetSetter = baseTargetDescriptor.set;
          this.inputFormTargetSetter = inputFormTargetDescriptor.set;
          this.buttonFormTargetSetter = buttonFormTargetDescriptor.set;
          this.svgAnimStrBaseValSetter = svgAnimStrBaseValDescriptor.set;
          this.inputAutocompleteSetter = inputAutocompleteDescriptor.set;
          this.formActionSetter = formActionDescriptor.set;
          this.inputFormActionSetter = inputFormActionDescriptor.set;
          this.buttonFormActionSetter = buttonFormActionDescriptor.set;
          this.iframeSandboxSetter = iframeSandboxDescriptor.set;
          this.metaHttpEquivSetter = metaHttpEquivDescriptor.set;
          this.htmlElementOnloadSetter = win.Object.getOwnPropertyDescriptor(win.HTMLElement.prototype, 'onload').set;
          this.nodeTextContentSetter = nodeTextContentDescriptor.set;
          this.htmlElementInnerTextSetter = htmlElementInnerTextDescriptor.set;
          this.scriptTextSetter = scriptTextDescriptor.set;
          this.anchorTextSetter = anchorTextDescriptor.set;
          this.elementInnerHTMLSetter = elementInnerHTMLDescriptor.set;
          this.elementOuterHTMLSetter = elementOuterHTMLDescriptor.set;
          this.scriptIntegritySetter = scriptIntegrityDescriptor.set;
          this.linkIntegritySetter = linkIntegrityDescriptor.set;
          this.titleElementTextSetter = titleElementTextDescriptor.set;
          this.elementClassListGetter = win.Object.getOwnPropertyDescriptor(win.Element.prototype, 'classList').get;
          this.htmlCollectionLengthGetter = win.Object.getOwnPropertyDescriptor(win.HTMLCollection.prototype, 'length').get;
          this.nodeListLengthGetter = win.Object.getOwnPropertyDescriptor(win.NodeList.prototype, 'length').get;
          this.elementChildElementCountGetter = win.Object.getOwnPropertyDescriptor(win.Element.prototype, 'childElementCount').get;
          this.inputFilesGetter = win.Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'files').get;
          this.styleSheetHrefGetter = win.Object.getOwnPropertyDescriptor(win.StyleSheet.prototype, 'href').get;
          this.objectDataGetter = objectDataDescriptor.get;
          this.inputTypeGetter = inputTypeDescriptor.get;
          this.inputValueGetter = inputValueDescriptor.get;
          this.inputRequiredGetter = inputRequiredDescriptor.get;
          this.textAreaValueGetter = textAreaValueDescriptor.get;
          this.imageSrcGetter = imageSrcDescriptor.get;
          this.scriptSrcGetter = scriptSrcDescriptor.get;
          this.embedSrcGetter = embedSrcDescriptor.get;
          this.sourceSrcGetter = sourceSrcDescriptor.get;
          this.mediaSrcGetter = mediaSrcDescriptor.get;
          this.inputSrcGetter = inputSrcDescriptor.get;
          this.frameSrcGetter = frameSrcDescriptor.get;
          this.iframeSrcGetter = iframeSrcDescriptor.get;
          this.anchorHrefGetter = anchorHrefDescriptor.get;
          this.linkHrefGetter = linkHrefDescriptor.get;
          this.linkRelGetter = linkRelDescriptor.get;
          this.areaHrefGetter = areaHrefDescriptor.get;
          this.baseHrefGetter = baseHrefDescriptor.get;
          this.anchorHostGetter = anchorHostDescriptor.get;
          this.anchorHostnameGetter = anchorHostnameDescriptor.get;
          this.anchorPathnameGetter = anchorPathnameDescriptor.get;
          this.anchorPortGetter = anchorPortDescriptor.get;
          this.anchorProtocolGetter = anchorProtocolDescriptor.get;
          this.anchorSearchGetter = anchorSearchDescriptor.get;
          this.anchorTargetGetter = anchorTargetDescriptor.get;
          this.formTargetGetter = formTargetDescriptor.get;
          this.areaTargetGetter = areaTargetDescriptor.get;
          this.baseTargetGetter = baseTargetDescriptor.get;
          this.inputFormTargetGetter = inputFormTargetDescriptor.get;
          this.buttonFormTargetGetter = buttonFormTargetDescriptor.get;
          this.svgImageHrefGetter = svgImageHrefDescriptor.get;
          this.svgAnimStrAnimValGetter = svgAnimStrAnimValDescriptor.get;
          this.svgAnimStrBaseValGetter = svgAnimStrBaseValDescriptor.get;
          this.inputAutocompleteGetter = inputAutocompleteDescriptor.get;
          this.formActionGetter = formActionDescriptor.get;
          this.inputFormActionGetter = inputFormActionDescriptor.get;
          this.buttonFormActionGetter = buttonFormActionDescriptor.get;
          this.iframeSandboxGetter = iframeSandboxDescriptor.get;
          this.metaHttpEquivGetter = metaHttpEquivDescriptor.get;
          this.contentWindowGetter = win.Object.getOwnPropertyDescriptor(win.HTMLIFrameElement.prototype, 'contentWindow').get;
          this.contentDocumentGetter = win.Object.getOwnPropertyDescriptor(win.HTMLIFrameElement.prototype, 'contentDocument').get;
          this.frameContentWindowGetter = win.Object.getOwnPropertyDescriptor(win.HTMLFrameElement.prototype, 'contentWindow').get;
          this.nodeTextContentGetter = nodeTextContentDescriptor.get;
          this.htmlElementInnerTextGetter = htmlElementInnerTextDescriptor.get;
          this.scriptTextGetter = scriptTextDescriptor.get;
          this.anchorTextGetter = anchorTextDescriptor.get;
          this.elementInnerHTMLGetter = elementInnerHTMLDescriptor.get;
          this.elementOuterHTMLGetter = elementOuterHTMLDescriptor.get;
          this.nodeFirstChildGetter = win.Object.getOwnPropertyDescriptor(win.Node.prototype, 'firstChild').get;
          this.nodeLastChildGetter = win.Object.getOwnPropertyDescriptor(win.Node.prototype, 'lastChild').get;
          this.nodeNextSiblingGetter = win.Object.getOwnPropertyDescriptor(win.Node.prototype, 'nextSibling').get;
          this.nodePrevSiblingGetter = win.Object.getOwnPropertyDescriptor(win.Node.prototype, 'previousSibling').get;
          this.nodeParentNodeGetter = win.Object.getOwnPropertyDescriptor(win.Node.prototype, 'parentNode').get;
          this.nodeChildNodesGetter = win.Object.getOwnPropertyDescriptor(win.Node.prototype, 'childNodes').get;
          this.elementFirstElementChildGetter = win.Object.getOwnPropertyDescriptor(win.Element.prototype, 'firstElementChild').get;
          this.elementLastElementChildGetter = win.Object.getOwnPropertyDescriptor(win.Element.prototype, 'lastElementChild').get;
          this.elementNextElementSiblingGetter = win.Object.getOwnPropertyDescriptor(win.Element.prototype, 'nextElementSibling').get;
          this.elementPrevElementSiblingGetter = win.Object.getOwnPropertyDescriptor(win.Element.prototype, 'previousElementSibling').get;
          this.scriptIntegrityGetter = scriptIntegrityDescriptor.get;
          this.linkIntegrityGetter = linkIntegrityDescriptor.get;
          this.elementChildrenGetter = win.Object.getOwnPropertyDescriptor(win.Element.prototype, 'children').get;
          this.anchorOriginGetter = win.Object.getOwnPropertyDescriptor(win.HTMLAnchorElement.prototype, 'origin').get;
          this.iframeSrcdocGetter = iframeSrcdocDescriptor.get;
          this.iframeSrcdocSetter = iframeSrcdocDescriptor.set;
          this.nodeBaseURIGetter = win.Object.getOwnPropertyDescriptor(win.Node.prototype, 'baseURI').get;
          this.elementAttributesGetter = win.Object.getOwnPropertyDescriptor(win.Element.prototype, 'attributes').get;
          var htmlManifestDescriptor = win.Object.getOwnPropertyDescriptor(win.HTMLHtmlElement.prototype, 'manifest');
          // NOTE: Only the Safari browser supports the 'manifest' property
          if (htmlManifestDescriptor) {
              this.htmlManifestGetter = htmlManifestDescriptor.get;
              this.htmlManifestSetter = htmlManifestDescriptor.set;
          }
          this.imageSrcsetSetter = imageSrcsetDescriptor.set;
          this.imageSrcsetGetter = imageSrcsetDescriptor.get;
          this.titleElementTextGetter = titleElementTextDescriptor.get;
          // MutationRecord
          this.mutationRecordNextSiblingGetter = win.Object.getOwnPropertyDescriptor(win.MutationRecord.prototype, 'nextSibling').get;
          this.mutationRecordPrevSiblingGetter = win.Object.getOwnPropertyDescriptor(win.MutationRecord.prototype, 'previousSibling').get;
      };
      NativeMethods.prototype.refreshWindowMeths = function (win, isInWorker) {
          if (isInWorker === void 0) { isInWorker = false; }
          win = win || window;
          var winProto = win.constructor.prototype;
          // Dom
          this.eval = win.eval;
          this.formSubmit = win.HTMLFormElement && win.HTMLFormElement.prototype.submit;
          this.documentFragmentQuerySelector = win.DocumentFragment && win.DocumentFragment.prototype.querySelector;
          this.documentFragmentQuerySelectorAll = win.DocumentFragment && win.DocumentFragment.prototype.querySelectorAll;
          this.preventDefault = win.Event.prototype.preventDefault;
          this.historyPushState = win.history && win.history.pushState;
          this.historyReplaceState = win.history && win.history.replaceState;
          this.postMessage = win.postMessage || winProto.postMessage;
          this.windowOpen = win.open || winProto.open;
          this.setTimeout = win.setTimeout || winProto.setTimeout;
          this.setInterval = win.setInterval || winProto.setInterval;
          this.clearTimeout = win.clearTimeout || winProto.clearTimeout;
          this.clearInterval = win.clearInterval || winProto.clearInterval;
          this.registerProtocolHandler = win.navigator.registerProtocolHandler;
          this.sendBeacon = win.Navigator && win.Navigator.prototype.sendBeacon;
          if (win.XMLHttpRequest) {
              this.xhrAbort = win.XMLHttpRequest.prototype.abort;
              this.xhrOpen = win.XMLHttpRequest.prototype.open;
              this.xhrSend = win.XMLHttpRequest.prototype.send;
              this.xhrAddEventListener = win.EventTarget.prototype.addEventListener;
              this.xhrRemoveEventListener = win.EventTarget.prototype.removeEventListener;
              this.xhrDispatchEvent = win.EventTarget.prototype.dispatchEvent;
              this.xhrGetResponseHeader = win.XMLHttpRequest.prototype.getResponseHeader;
              this.xhrGetAllResponseHeaders = win.XMLHttpRequest.prototype.getAllResponseHeaders;
              this.xhrSetRequestHeader = win.XMLHttpRequest.prototype.setRequestHeader;
              this.xhrOverrideMimeType = win.XMLHttpRequest.prototype.overrideMimeType;
          }
          try {
              this.registerServiceWorker = win.navigator.serviceWorker.register;
              this.getRegistrationServiceWorker = win.navigator.serviceWorker.getRegistration;
          }
          catch (e) {
              this.registerServiceWorker = null;
              this.getRegistrationServiceWorker = null;
          }
          this.createContextualFragment = win.Range && win.Range.prototype.createContextualFragment;
          var nativePerformance = win.performance;
          if (nativePerformance) {
              // eslint-disable-next-line no-restricted-properties
              var nativePerformanceNow_1 = win.performance.now || win.Performance.prototype.now;
              this.performanceNow = function () {
                  var args = [];
                  for (var _i = 0; _i < arguments.length; _i++) {
                      args[_i] = arguments[_i];
                  }
                  return nativePerformanceNow_1.apply(nativePerformance, args);
              };
          }
          // Fetch
          this.fetch = win.fetch;
          this.Request = win.Request;
          if (win.Headers) {
              this.Headers = win.Headers;
              this.headersSet = win.Headers.prototype.set;
              this.headersGet = win.Headers.prototype.get;
              this.headersDelete = win.Headers.prototype.delete;
              this.headersEntries = win.Headers.prototype.entries;
              this.headersForEach = win.Headers.prototype.forEach;
              this.headersValues = win.Headers.prototype.values;
          }
          // Event
          this.windowAddEventListener = win.addEventListener || winProto.addEventListener;
          this.windowRemoveEventListener = win.removeEventListener || winProto.removeEventListener;
          this.windowDispatchEvent = win.dispatchEvent;
          this.WindowPointerEvent = win.PointerEvent || winProto.PointerEvent;
          this.WindowMSPointerEvent = win.MSPointerEvent || winProto.MSPointerEvent;
          this.WindowTouch = win.Touch || winProto.Touch;
          this.WindowTouchEvent = win.TouchEvent || winProto.TouchEvent;
          this.WindowKeyboardEvent = win.KeyboardEvent || winProto.KeyboardEvent;
          this.WindowFocusEvent = win.FocusEvent || winProto.FocusEvent;
          this.WindowTextEvent = win.TextEvent || winProto.TextEvent;
          this.WindowInputEvent = win.InputEvent || winProto.InputEvent;
          this.WindowMouseEvent = win.MouseEvent || winProto.MouseEvent;
          this.eventTargetGetter = win.Object.getOwnPropertyDescriptor(win.Event.prototype, 'target').get;
          this.canvasContextDrawImage = win.CanvasRenderingContext2D && win.CanvasRenderingContext2D.prototype.drawImage;
          // FormData
          this.formDataAppend = win.FormData && win.FormData.prototype.append;
          // DateTime
          this.date = win.Date;
          this.dateNow = win.Date.now; // eslint-disable-line no-restricted-properties
          // Math
          this.math = win.Math;
          this.mathRandom = win.Math.random;
          // Object
          this.objectToString = win.Object.prototype.toString;
          this.objectAssign = win.Object.assign;
          this.objectKeys = win.Object.keys;
          this.objectDefineProperty = win.Object.defineProperty;
          this.objectDefineProperties = win.Object.defineProperties;
          this.objectCreate = win.Object.create;
          this.objectIsExtensible = win.Object.isExtensible;
          this.objectIsFrozen = win.Object.isFrozen;
          this.objectGetOwnPropertyDescriptor = win.Object.getOwnPropertyDescriptor;
          this.objectHasOwnProperty = win.Object.hasOwnProperty;
          this.objectGetOwnPropertyNames = win.Object.getOwnPropertyNames;
          this.objectGetPrototypeOf = win.Object.getPrototypeOf;
          this.objectSetPrototypeOf = win.Object.setPrototypeOf;
          this.objectGetOwnPropertySymbols = win.Object.getOwnPropertySymbols;
          // Array
          this.arraySlice = win.Array.prototype.slice;
          this.arrayConcat = win.Array.prototype.concat;
          this.arrayFilter = win.Array.prototype.filter;
          this.arrayFind = win.Array.prototype.find;
          this.arrayMap = win.Array.prototype.map;
          this.arrayJoin = win.Array.prototype.join;
          this.arraySplice = win.Array.prototype.splice;
          this.arrayUnshift = win.Array.prototype.unshift;
          this.arrayForEach = win.Array.prototype.forEach;
          this.arrayIndexOf = win.Array.prototype.indexOf;
          this.arraySome = win.Array.prototype.some;
          this.arrayEvery = win.Array.prototype.every;
          this.arrayReverse = win.Array.prototype.reverse;
          this.arrayReduce = win.Array.prototype.reduce;
          this.arrayFrom = win.Array.from;
          this.isArray = win.Array.isArray;
          this.DOMParserParseFromString = win.DOMParser && win.DOMParser.prototype.parseFromString;
          this.arrayBufferIsView = win.ArrayBuffer.prototype.constructor.isView;
          // NOTE: this section relates to getting properties from DOM classes
          if (!isInWorker) {
              // DOMTokenList
              this.tokenListAdd = win.DOMTokenList.prototype.add;
              this.tokenListRemove = win.DOMTokenList.prototype.remove;
              this.tokenListReplace = win.DOMTokenList.prototype.replace;
              this.tokenListSupports = win.DOMTokenList.prototype.supports;
              this.tokenListToggle = win.DOMTokenList.prototype.toggle;
              this.tokenListContains = win.DOMTokenList.prototype.contains;
              this.tokenListValueSetter = win.Object.getOwnPropertyDescriptor(win.DOMTokenList.prototype, 'value').set;
              // Stylesheets
              this.styleGetPropertyValue = win.CSSStyleDeclaration.prototype.getPropertyValue;
              this.styleSetProperty = win.CSSStyleDeclaration.prototype.setProperty;
              this.styleRemoveProperty = win.CSSStyleDeclaration.prototype.removeProperty;
              this.styleInsertRule = win.CSSStyleSheet.prototype.insertRule;
              this.scrollTo = win.scrollTo;
          }
          if (win.Promise) {
              this.promiseThen = win.Promise.prototype.then;
              this.promiseReject = win.Promise.reject;
          }
          // Console
          this.console = win.console;
          if (this.console) {
              this.consoleMeths = {
                  log: win.console.log,
                  warn: win.console.warn,
                  error: win.console.error,
                  info: win.console.info,
              };
          }
          this.crypto = win.crypto || win.msCrypto;
          this.cryptoGetRandomValues = this.crypto && this.crypto.getRandomValues;
          this.refreshClasses(win);
          this._refreshGettersAndSetters(win, isInWorker);
      };
      NativeMethods.prototype.refreshClasses = function (win) {
          this.windowClass = win.Window;
          this.documentClass = win.Document;
          this.locationClass = win.Location;
          this.elementClass = win.Element;
          this.svgElementClass = win.SVGElement;
          this.Worker = win.Worker;
          this.MessageChannel = win.MessageChannel;
          this.Array = win.Array;
          this.ArrayBuffer = win.ArrayBuffer;
          this.Uint8Array = win.Uint8Array;
          this.Uint16Array = win.Uint16Array;
          this.Uint32Array = win.Uint32Array;
          this.DataView = win.DataView;
          this.Blob = win.Blob;
          this.XMLHttpRequest = win.XMLHttpRequest;
          this.Image = win.Image;
          this.Function = win.Function;
          this.functionToString = win.Function.prototype.toString;
          this.functionBind = win.Function.prototype.bind;
          this.Error = win.Error;
          this.FontFace = win.FontFace;
          this.StorageEvent = win.StorageEvent;
          this.MutationObserver = win.MutationObserver;
          this.EventSource = win.EventSource;
          this.Proxy = win.Proxy;
          this.WebSocket = win.WebSocket;
          this.HTMLCollection = win.HTMLCollection;
          this.NodeList = win.NodeList;
          this.Node = win.Node;
          this.URL = win.URL;
          this.DataTransfer = win.DataTransfer;
          this.DataTransferItemList = win.DataTransferItemList;
          this.DataTransferItem = win.DataTransferItem;
          this.FileList = win.FileList;
          this.File = win.File;
      };
      NativeMethods.prototype.refreshElectronMeths = function (vmModule) {
          if (this.createScript && isNativeFunction(vmModule.createScript))
              return false;
          this.createScript = vmModule.createScript;
          this.runInDebugContext = vmModule.runInDebugContext;
          this.runInContext = vmModule.runInContext;
          this.runInNewContext = vmModule.runInNewContext;
          this.runInThisContext = vmModule.runInThisContext;
          return true;
      };
      NativeMethods._ensureDocumentMethodRestore = function (document, prototype, methodName, savedNativeMethod) {
          prototype[methodName] = savedNativeMethod;
          if (document[methodName] !== prototype[methodName])
              document[methodName] = savedNativeMethod;
      };
      NativeMethods.prototype.restoreDocumentMeths = function (window, document) {
          var docPrototype = window.Document.prototype;
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'createDocumentFragment', this.createDocumentFragment);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'createElement', this.createElement);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'createElementNS', this.createElementNS);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'elementFromPoint', this.elementFromPoint);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'caretRangeFromPoint', this.caretRangeFromPoint);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'caretPositionFromPoint', this.caretPositionFromPoint);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'getElementById', this.getElementById);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'getElementsByClassName', this.getElementsByClassName);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'getElementsByName', this.getElementsByName);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'getElementsByTagName', this.getElementsByTagName);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'querySelector', this.querySelector);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'querySelectorAll', this.querySelectorAll);
          // Event
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'addEventListener', this.documentAddEventListener);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'removeEventListener', this.documentRemoveEventListener);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'createEvent', this.documentCreateEvent);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'createTouch', this.documentCreateTouch);
          NativeMethods._ensureDocumentMethodRestore(document, docPrototype, 'createTouchList', this.documentCreateTouchList);
          NativeMethods._ensureDocumentMethodRestore(document, window[this.documentOpenPropOwnerName].prototype, 'open', this.documentOpen);
          NativeMethods._ensureDocumentMethodRestore(document, window[this.documentClosePropOwnerName].prototype, 'close', this.documentClose);
          NativeMethods._ensureDocumentMethodRestore(document, window[this.documentWritePropOwnerName].prototype, 'write', this.documentWrite);
          NativeMethods._ensureDocumentMethodRestore(document, window[this.documentWriteLnPropOwnerName].prototype, 'writeln', this.documentWriteLn);
      };
      NativeMethods.prototype.isNativeCode = function (fn) {
          return NATIVE_CODE_RE.test(this.functionToString.call(fn));
      };
      return NativeMethods;
  }());
  var nativeMethods = new NativeMethods();

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn) {
    var module = { exports: {} };
  	return fn(module, module.exports), module.exports;
  }

  /*!
   * Bowser - a browser detector
   * https://github.com/ded/bowser
   * MIT License | (c) Dustin Diaz 2015
   */

  var bowser = createCommonjsModule(function (module) {
  !function (root, name, definition) {
    if (module.exports) module.exports = definition();
    else root[name] = definition();
  }(commonjsGlobal, 'bowser', function () {
    /**
      * See useragents.js for examples of navigator.userAgent
      */

    var t = true;

    function detect(ua) {

      function getFirstMatch(regex) {
        var match = ua.match(regex);
        return (match && match.length > 1 && match[1]) || '';
      }

      function getSecondMatch(regex) {
        var match = ua.match(regex);
        return (match && match.length > 1 && match[2]) || '';
      }

      var iosdevice = getFirstMatch(/(ipod|iphone|ipad)/i).toLowerCase()
        , likeAndroid = /like android/i.test(ua)
        , android = !likeAndroid && /android/i.test(ua)
        , nexusMobile = /nexus\s*[0-6]\s*/i.test(ua)
        , nexusTablet = !nexusMobile && /nexus\s*[0-9]+/i.test(ua)
        , chromeos = /CrOS/.test(ua)
        , silk = /silk/i.test(ua)
        , sailfish = /sailfish/i.test(ua)
        , tizen = /tizen/i.test(ua)
        , webos = /(web|hpw)os/i.test(ua)
        , windowsphone = /windows phone/i.test(ua)
        ; /SamsungBrowser/i.test(ua)
        ; var windows = !windowsphone && /windows/i.test(ua)
        , mac = !iosdevice && !silk && /macintosh/i.test(ua)
        , linux = !android && !sailfish && !tizen && !webos && /linux/i.test(ua)
        , edgeVersion = getFirstMatch(/edge\/(\d+(\.\d+)?)/i)
        , versionIdentifier = getFirstMatch(/version\/(\d+(\.\d+)?)/i)
        , tablet = /tablet/i.test(ua)
        , mobile = !tablet && /[^-]mobi/i.test(ua)
        , xbox = /xbox/i.test(ua)
        , result;

      if (/opera/i.test(ua)) {
        //  an old Opera
        result = {
          name: 'Opera'
        , opera: t
        , version: versionIdentifier || getFirstMatch(/(?:opera|opr|opios)[\s\/](\d+(\.\d+)?)/i)
        };
      } else if (/opr|opios/i.test(ua)) {
        // a new Opera
        result = {
          name: 'Opera'
          , opera: t
          , version: getFirstMatch(/(?:opr|opios)[\s\/](\d+(\.\d+)?)/i) || versionIdentifier
        };
      }
      else if (/SamsungBrowser/i.test(ua)) {
        result = {
          name: 'Samsung Internet for Android'
          , samsungBrowser: t
          , version: versionIdentifier || getFirstMatch(/(?:SamsungBrowser)[\s\/](\d+(\.\d+)?)/i)
        };
      }
      else if (/coast/i.test(ua)) {
        result = {
          name: 'Opera Coast'
          , coast: t
          , version: versionIdentifier || getFirstMatch(/(?:coast)[\s\/](\d+(\.\d+)?)/i)
        };
      }
      else if (/yabrowser/i.test(ua)) {
        result = {
          name: 'Yandex Browser'
        , yandexbrowser: t
        , version: versionIdentifier || getFirstMatch(/(?:yabrowser)[\s\/](\d+(\.\d+)?)/i)
        };
      }
      else if (/ucbrowser/i.test(ua)) {
        result = {
            name: 'UC Browser'
          , ucbrowser: t
          , version: getFirstMatch(/(?:ucbrowser)[\s\/](\d+(?:\.\d+)+)/i)
        };
      }
      else if (/mxios/i.test(ua)) {
        result = {
          name: 'Maxthon'
          , maxthon: t
          , version: getFirstMatch(/(?:mxios)[\s\/](\d+(?:\.\d+)+)/i)
        };
      }
      else if (/epiphany/i.test(ua)) {
        result = {
          name: 'Epiphany'
          , epiphany: t
          , version: getFirstMatch(/(?:epiphany)[\s\/](\d+(?:\.\d+)+)/i)
        };
      }
      else if (/puffin/i.test(ua)) {
        result = {
          name: 'Puffin'
          , puffin: t
          , version: getFirstMatch(/(?:puffin)[\s\/](\d+(?:\.\d+)?)/i)
        };
      }
      else if (/sleipnir/i.test(ua)) {
        result = {
          name: 'Sleipnir'
          , sleipnir: t
          , version: getFirstMatch(/(?:sleipnir)[\s\/](\d+(?:\.\d+)+)/i)
        };
      }
      else if (/k-meleon/i.test(ua)) {
        result = {
          name: 'K-Meleon'
          , kMeleon: t
          , version: getFirstMatch(/(?:k-meleon)[\s\/](\d+(?:\.\d+)+)/i)
        };
      }
      else if (windowsphone) {
        result = {
          name: 'Windows Phone'
        , windowsphone: t
        };
        if (edgeVersion) {
          result.msedge = t;
          result.version = edgeVersion;
        }
        else {
          result.msie = t;
          result.version = getFirstMatch(/iemobile\/(\d+(\.\d+)?)/i);
        }
      }
      else if (/msie|trident/i.test(ua)) {
        result = {
          name: 'Internet Explorer'
        , msie: t
        , version: getFirstMatch(/(?:msie |rv:)(\d+(\.\d+)?)/i)
        };
      } else if (chromeos) {
        result = {
          name: 'Chrome'
        , chromeos: t
        , chromeBook: t
        , chrome: t
        , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
        };
      } else if (/chrome.+? edge/i.test(ua)) {
        result = {
          name: 'Microsoft Edge'
        , msedge: t
        , version: edgeVersion
        };
      }
      else if (/vivaldi/i.test(ua)) {
        result = {
          name: 'Vivaldi'
          , vivaldi: t
          , version: getFirstMatch(/vivaldi\/(\d+(\.\d+)?)/i) || versionIdentifier
        };
      }
      else if (sailfish) {
        result = {
          name: 'Sailfish'
        , sailfish: t
        , version: getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i)
        };
      }
      else if (/seamonkey\//i.test(ua)) {
        result = {
          name: 'SeaMonkey'
        , seamonkey: t
        , version: getFirstMatch(/seamonkey\/(\d+(\.\d+)?)/i)
        };
      }
      else if (/firefox|iceweasel|fxios/i.test(ua)) {
        result = {
          name: 'Firefox'
        , firefox: t
        , version: getFirstMatch(/(?:firefox|iceweasel|fxios)[ \/](\d+(\.\d+)?)/i)
        };
        if (/\((mobile|tablet);[^\)]*rv:[\d\.]+\)/i.test(ua)) {
          result.firefoxos = t;
        }
      }
      else if (silk) {
        result =  {
          name: 'Amazon Silk'
        , silk: t
        , version : getFirstMatch(/silk\/(\d+(\.\d+)?)/i)
        };
      }
      else if (/phantom/i.test(ua)) {
        result = {
          name: 'PhantomJS'
        , phantom: t
        , version: getFirstMatch(/phantomjs\/(\d+(\.\d+)?)/i)
        };
      }
      else if (/slimerjs/i.test(ua)) {
        result = {
          name: 'SlimerJS'
          , slimer: t
          , version: getFirstMatch(/slimerjs\/(\d+(\.\d+)?)/i)
        };
      }
      else if (/blackberry|\bbb\d+/i.test(ua) || /rim\stablet/i.test(ua)) {
        result = {
          name: 'BlackBerry'
        , blackberry: t
        , version: versionIdentifier || getFirstMatch(/blackberry[\d]+\/(\d+(\.\d+)?)/i)
        };
      }
      else if (webos) {
        result = {
          name: 'WebOS'
        , webos: t
        , version: versionIdentifier || getFirstMatch(/w(?:eb)?osbrowser\/(\d+(\.\d+)?)/i)
        };
        /touchpad\//i.test(ua) && (result.touchpad = t);
      }
      else if (/bada/i.test(ua)) {
        result = {
          name: 'Bada'
        , bada: t
        , version: getFirstMatch(/dolfin\/(\d+(\.\d+)?)/i)
        };
      }
      else if (tizen) {
        result = {
          name: 'Tizen'
        , tizen: t
        , version: getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.\d+)?)/i) || versionIdentifier
        };
      }
      else if (/qupzilla/i.test(ua)) {
        result = {
          name: 'QupZilla'
          , qupzilla: t
          , version: getFirstMatch(/(?:qupzilla)[\s\/](\d+(?:\.\d+)+)/i) || versionIdentifier
        };
      }
      else if (/chromium/i.test(ua)) {
        result = {
          name: 'Chromium'
          , chromium: t
          , version: getFirstMatch(/(?:chromium)[\s\/](\d+(?:\.\d+)?)/i) || versionIdentifier
        };
      }
      else if (/chrome|crios|crmo/i.test(ua)) {
        result = {
          name: 'Chrome'
          , chrome: t
          , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
        };
      }
      else if (android) {
        result = {
          name: 'Android'
          , version: versionIdentifier
        };
      }
      else if (/safari|applewebkit/i.test(ua)) {
        result = {
          name: 'Safari'
        , safari: t
        };
        if (versionIdentifier) {
          result.version = versionIdentifier;
        }
      }
      else if (iosdevice) {
        result = {
          name : iosdevice == 'iphone' ? 'iPhone' : iosdevice == 'ipad' ? 'iPad' : 'iPod'
        };
        // WTF: version is not part of user agent in web apps
        if (versionIdentifier) {
          result.version = versionIdentifier;
        }
      }
      else if(/googlebot/i.test(ua)) {
        result = {
          name: 'Googlebot'
        , googlebot: t
        , version: getFirstMatch(/googlebot\/(\d+(\.\d+))/i) || versionIdentifier
        };
      }
      else {
        result = {
          name: getFirstMatch(/^(.*)\/(.*) /),
          version: getSecondMatch(/^(.*)\/(.*) /)
       };
     }

      // set webkit or gecko flag for browsers based on these engines
      if (!result.msedge && /(apple)?webkit/i.test(ua)) {
        if (/(apple)?webkit\/537\.36/i.test(ua)) {
          result.name = result.name || "Blink";
          result.blink = t;
        } else {
          result.name = result.name || "Webkit";
          result.webkit = t;
        }
        if (!result.version && versionIdentifier) {
          result.version = versionIdentifier;
        }
      } else if (!result.opera && /gecko\//i.test(ua)) {
        result.name = result.name || "Gecko";
        result.gecko = t;
        result.version = result.version || getFirstMatch(/gecko\/(\d+(\.\d+)?)/i);
      }

      // set OS flags for platforms that have multiple browsers
      if (!result.windowsphone && !result.msedge && (android || result.silk)) {
        result.android = t;
      } else if (!result.windowsphone && !result.msedge && iosdevice) {
        result[iosdevice] = t;
        result.ios = t;
      } else if (mac) {
        result.mac = t;
      } else if (xbox) {
        result.xbox = t;
      } else if (windows) {
        result.windows = t;
      } else if (linux) {
        result.linux = t;
      }

      // OS version extraction
      var osVersion = '';
      if (result.windowsphone) {
        osVersion = getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i);
      } else if (iosdevice) {
        osVersion = getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i);
        osVersion = osVersion.replace(/[_\s]/g, '.');
      } else if (android) {
        osVersion = getFirstMatch(/android[ \/-](\d+(\.\d+)*)/i);
      } else if (result.webos) {
        osVersion = getFirstMatch(/(?:web|hpw)os\/(\d+(\.\d+)*)/i);
      } else if (result.blackberry) {
        osVersion = getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i);
      } else if (result.bada) {
        osVersion = getFirstMatch(/bada\/(\d+(\.\d+)*)/i);
      } else if (result.tizen) {
        osVersion = getFirstMatch(/tizen[\/\s](\d+(\.\d+)*)/i);
      }
      if (osVersion) {
        result.osversion = osVersion;
      }

      // device type extraction
      var osMajorVersion = osVersion.split('.')[0];
      if (
           tablet
        || nexusTablet
        || iosdevice == 'ipad'
        || (android && (osMajorVersion == 3 || (osMajorVersion >= 4 && !mobile)))
        || result.silk
      ) {
        result.tablet = t;
      } else if (
           mobile
        || iosdevice == 'iphone'
        || iosdevice == 'ipod'
        || android
        || nexusMobile
        || result.blackberry
        || result.webos
        || result.bada
      ) {
        result.mobile = t;
      }

      // Graded Browser Support
      // http://developer.yahoo.com/yui/articles/gbs
      if (result.msedge ||
          (result.msie && result.version >= 10) ||
          (result.yandexbrowser && result.version >= 15) ||
  		    (result.vivaldi && result.version >= 1.0) ||
          (result.chrome && result.version >= 20) ||
          (result.samsungBrowser && result.version >= 4) ||
          (result.firefox && result.version >= 20.0) ||
          (result.safari && result.version >= 6) ||
          (result.opera && result.version >= 10.0) ||
          (result.ios && result.osversion && result.osversion.split(".")[0] >= 6) ||
          (result.blackberry && result.version >= 10.1)
          || (result.chromium && result.version >= 20)
          ) {
        result.a = t;
      }
      else if ((result.msie && result.version < 10) ||
          (result.chrome && result.version < 20) ||
          (result.firefox && result.version < 20.0) ||
          (result.safari && result.version < 6) ||
          (result.opera && result.version < 10.0) ||
          (result.ios && result.osversion && result.osversion.split(".")[0] < 6)
          || (result.chromium && result.version < 20)
          ) {
        result.c = t;
      } else result.x = t;

      return result
    }

    var bowser = detect(typeof navigator !== 'undefined' ? navigator.userAgent || '' : '');

    bowser.test = function (browserList) {
      for (var i = 0; i < browserList.length; ++i) {
        var browserItem = browserList[i];
        if (typeof browserItem=== 'string') {
          if (browserItem in bowser) {
            return true;
          }
        }
      }
      return false;
    };

    /**
     * Get version precisions count
     *
     * @example
     *   getVersionPrecision("1.10.3") // 3
     *
     * @param  {string} version
     * @return {number}
     */
    function getVersionPrecision(version) {
      return version.split(".").length;
    }

    /**
     * Array::map polyfill
     *
     * @param  {Array} arr
     * @param  {Function} iterator
     * @return {Array}
     */
    function map(arr, iterator) {
      var result = [], i;
      if (Array.prototype.map) {
        return Array.prototype.map.call(arr, iterator);
      }
      for (i = 0; i < arr.length; i++) {
        result.push(iterator(arr[i]));
      }
      return result;
    }

    /**
     * Calculate browser version weight
     *
     * @example
     *   compareVersions(['1.10.2.1',  '1.8.2.1.90'])    // 1
     *   compareVersions(['1.010.2.1', '1.09.2.1.90']);  // 1
     *   compareVersions(['1.10.2.1',  '1.10.2.1']);     // 0
     *   compareVersions(['1.10.2.1',  '1.0800.2']);     // -1
     *
     * @param  {Array<String>} versions versions to compare
     * @return {Number} comparison result
     */
    function compareVersions(versions) {
      // 1) get common precision for both versions, for example for "10.0" and "9" it should be 2
      var precision = Math.max(getVersionPrecision(versions[0]), getVersionPrecision(versions[1]));
      var chunks = map(versions, function (version) {
        var delta = precision - getVersionPrecision(version);

        // 2) "9" -> "9.0" (for precision = 2)
        version = version + new Array(delta + 1).join(".0");

        // 3) "9.0" -> ["000000000"", "000000009"]
        return map(version.split("."), function (chunk) {
          return new Array(20 - chunk.length).join("0") + chunk;
        }).reverse();
      });

      // iterate in reverse order by reversed chunks array
      while (--precision >= 0) {
        // 4) compare: "000000009" > "000000010" = false (but "9" > "10" = true)
        if (chunks[0][precision] > chunks[1][precision]) {
          return 1;
        }
        else if (chunks[0][precision] === chunks[1][precision]) {
          if (precision === 0) {
            // all version chunks are same
            return 0;
          }
        }
        else {
          return -1;
        }
      }
    }

    /**
     * Check if browser is unsupported
     *
     * @example
     *   bowser.isUnsupportedBrowser({
     *     msie: "10",
     *     firefox: "23",
     *     chrome: "29",
     *     safari: "5.1",
     *     opera: "16",
     *     phantom: "534"
     *   });
     *
     * @param  {Object}  minVersions map of minimal version to browser
     * @param  {Boolean} [strictMode = false] flag to return false if browser wasn't found in map
     * @param  {String}  [ua] user agent string
     * @return {Boolean}
     */
    function isUnsupportedBrowser(minVersions, strictMode, ua) {
      var _bowser = bowser;

      // make strictMode param optional with ua param usage
      if (typeof strictMode === 'string') {
        ua = strictMode;
        strictMode = void(0);
      }

      if (strictMode === void(0)) {
        strictMode = false;
      }
      if (ua) {
        _bowser = detect(ua);
      }

      var version = "" + _bowser.version;
      for (var browser in minVersions) {
        if (minVersions.hasOwnProperty(browser)) {
          if (_bowser[browser]) {
            if (typeof minVersions[browser] !== 'string') {
              throw new Error('Browser version in the minVersion map should be a string: ' + browser + ': ' + String(minVersions));
            }

            // browser version and min supported version.
            return compareVersions([version, minVersions[browser]]) < 0;
          }
        }
      }

      return strictMode; // not found
    }

    /**
     * Check if browser is supported
     *
     * @param  {Object} minVersions map of minimal version to browser
     * @param  {Boolean} [strictMode = false] flag to return false if browser wasn't found in map
     * @param  {String}  [ua] user agent string
     * @return {Boolean}
     */
    function check(minVersions, strictMode, ua) {
      return !isUnsupportedBrowser(minVersions, strictMode, ua);
    }

    bowser.isUnsupportedBrowser = isUnsupportedBrowser;
    bowser.compareVersions = compareVersions;
    bowser.check = check;

    /*
     * Set our detect method to the main bowser object so we can
     * reuse it to test other user agents.
     * This is needed to implement future tests.
     */
    bowser._detect = detect;

    return bowser
  });
  });

  var userAgent = navigator.userAgent.toLowerCase();
  //@ts-ignore
  var info = bowser._detect(userAgent);
  var webkitVersionMatch = userAgent.match(/applewebkit\/(\d+(:?\.\d+)*)/);
  //Helper
  //@ts-ignore
  bowser.compareVersions;
  //Platforms
  !!info.mac;
  !!info.android;
  !!info.ios;
  !!info.mobile;
  !!info.tablet;
  //Browsers
  parseInt(info.version, 10);
  info.version;
  webkitVersionMatch && webkitVersionMatch[1] || '';
  !!(info.msie || info.msedge);
  !!info.firefox;
  !!info.msedge;
  !!info.chrome;
  var isSafari = !!info.safari;
  !!(info.webkit || info.blink);
  /electron/g.test(userAgent);

  var instanceAndPrototypeToStringAreEqual = false;
  if (nativeMethods.createElement) {
      // NOTE: In Chrome, toString(window) equals '[object Window]' and toString(Window.prototype) equals '[object Blob]',
      // this condition is also satisfied for Blob, Document, XMLHttpRequest, etc
      instanceAndPrototypeToStringAreEqual = nativeMethods.objectToString.call(window) ===
          nativeMethods.objectToString.call(Window.prototype);
  }

  function isFunction(val) {
      return typeof val === 'function';
  }

  var WINDOW_IS_UNDEFINED = typeof window === 'undefined';
  WINDOW_IS_UNDEFINED ? '' : instanceToString(window);
  WINDOW_IS_UNDEFINED ? '' : instanceToString(nativeMethods.createElement.call(document, 'td'));
  var ELEMENT_NODE_TYPE = WINDOW_IS_UNDEFINED ? -1 : Node.ELEMENT_NODE;
  function instanceToString(instance) {
      if (!instanceAndPrototypeToStringAreEqual)
          return nativeMethods.objectToString.call(instance);
      return instance && typeof instance === 'object'
          ? nativeMethods.objectToString.call(nativeMethods.objectGetPrototypeOf(instance))
          : '';
  }
  function getIframeLocation(iframe) {
      var documentLocation = null;
      try {
          // eslint-disable-next-line no-restricted-properties
          documentLocation = nativeMethods.contentDocumentGetter.call(iframe).location.href;
      }
      catch (e) {
          documentLocation = null;
      }
      var srcLocation = nativeMethods.getAttribute.call(iframe, 'src' + INTERNAL_ATTRS.storedAttrPostfix) ||
          nativeMethods.getAttribute.call(iframe, 'src') || nativeMethods.iframeSrcGetter.call(iframe);
      var parsedProxyDocumentLocation = documentLocation && isSupportedProtocol(documentLocation) &&
          parseProxyUrl(documentLocation);
      var parsedProxySrcLocation = srcLocation && isSupportedProtocol(srcLocation) &&
          parseProxyUrl(srcLocation);
      return {
          documentLocation: parsedProxyDocumentLocation ? parsedProxyDocumentLocation.destUrl : documentLocation,
          srcLocation: parsedProxySrcLocation ? parsedProxySrcLocation.destUrl : srcLocation,
      };
  }
  function getFrameElement(win) {
      try {
          return win.frameElement;
      }
      catch (e) {
          return null;
      }
  }
  function findDocument(el) {
      if (el.documentElement)
          return el;
      if (el.ownerDocument && el.ownerDocument.defaultView)
          return el.ownerDocument;
      var parent = isElementNode(el) && nativeMethods.nodeParentNodeGetter.call(el);
      return parent ? findDocument(parent) : document;
  }
  var SHADOW_ROOT_PARENT_ELEMENT = 'hammerhead|element|shadow-root-parent';
  function getNodeShadowRootParent(el) {
      var parent = nativeMethods.nodeParentNodeGetter.call(el);
      while (parent && parent.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)
          parent = nativeMethods.nodeParentNodeGetter.call(parent);
      return parent && parent[SHADOW_ROOT_PARENT_ELEMENT];
  }
  function isElementInDocument(el, currentDocument) {
      var doc = currentDocument || document;
      if (!doc.documentElement)
          return false;
      if (doc.documentElement.contains(el))
          return true;
      var shadowRootParent = getNodeShadowRootParent(el);
      return shadowRootParent ? isElementInDocument(shadowRootParent) : false;
  }
  function isIframeWithoutSrc(iframe) {
      var iframeLocation = getIframeLocation(iframe);
      var iframeSrcLocation = iframeLocation.srcLocation;
      var iframeDocumentLocation = iframeLocation.documentLocation;
      // NOTE: is a cross-domain iframe
      if (iframeDocumentLocation === null)
          return false;
      // NOTE: after 'document.write' or 'document.open' call for iframe with/without src
      // we will process it as iframe without src
      if (nativeMethods.contentWindowGetter.call(iframe)[INTERNAL_PROPS.documentWasCleaned])
          return true;
      var iframeDocumentLocationHaveSupportedProtocol = isSupportedProtocol(iframeDocumentLocation);
      // NOTE: When an iframe has an empty src attribute (<iframe src></iframe>) or has no src attribute (<iframe></iframe>),
      // the iframe.src property is not empty but has different values in different browsers.
      // Its document location is 'about:blank'. Therefore, we should check the src attribute.
      if (!iframeDocumentLocationHaveSupportedProtocol && !nativeMethods.getAttribute.call(iframe, 'src'))
          return true;
      // In Chrome, when an iframe with the src attribute is added to DOM,
      // its documentLocation is set to "about:blank" until the iframe has been loaded.
      // So, we should check srcLocation in this case.
      if (iframeSrcLocation && isSupportedProtocol(iframeSrcLocation))
          return false;
      return !iframeDocumentLocationHaveSupportedProtocol;
  }
  function isFetchHeaders(instance) {
      if (nativeMethods.Headers && instance instanceof nativeMethods.Headers)
          return true;
      return instance && instanceToString(instance) === '[object Headers]';
  }
  function isFetchRequest(instance) {
      if (nativeMethods.Request && instance instanceof nativeMethods.Request)
          return true;
      return instance && instanceToString(instance) === '[object Request]';
  }
  function isElementNode(node) {
      return node && node.nodeType === ELEMENT_NODE_TYPE;
  }

  var DOCUMENT_URL_RESOLVER = 'hammerhead|document-url-resolver';
  var urlResolver = {
      _createResolver: function (doc) {
          var htmlDocument = nativeMethods.createHTMLDocument.call(doc.implementation, 'title');
          var a = nativeMethods.createElement.call(htmlDocument, 'a');
          var base = nativeMethods.createElement.call(htmlDocument, 'base');
          nativeMethods.appendChild.call(htmlDocument.body, a);
          nativeMethods.appendChild.call(htmlDocument.head, base);
          return htmlDocument;
      },
      _getResolver: function (doc) {
          // NOTE: Once a document is recreated (document.open, document.write is called), nativeMethods will be refreshed.
          // If we call urlResolve.updateBase after this,
          // we will use native methods from an actual document.
          // However, a document that contains an element for url resolving is created using a previous version of nativeMethods.
          if (!doc[DOCUMENT_URL_RESOLVER]) {
              nativeMethods.objectDefineProperty(doc, DOCUMENT_URL_RESOLVER, {
                  value: this._createResolver(doc),
                  writable: true,
              });
          }
          return doc[DOCUMENT_URL_RESOLVER];
      },
      _isNestedIframeWithoutSrc: function (win) {
          if (!win || !win.parent || win.parent === win || win.parent.parent === win.parent)
              return false;
          var iframeElement = getFrameElement(window);
          return !!iframeElement && isIframeWithoutSrc(iframeElement);
      },
      init: function (doc) {
          this.updateBase(get(), doc);
      },
      getResolverElement: function (doc) {
          return nativeMethods.nodeFirstChildGetter.call(this._getResolver(doc).body);
      },
      resolve: function (url, doc) {
          var resolver = this.getResolverElement(doc);
          var href = null;
          if (url === null)
              nativeMethods.removeAttribute.call(resolver, 'href');
          else {
              nativeMethods.anchorHrefSetter.call(resolver, url);
              href = nativeMethods.anchorHrefGetter.call(resolver);
              // NOTE: It looks like a Chrome bug: in a nested iframe without src (when an iframe is placed into another
              // iframe) you cannot set a relative link href while the iframe loading is not completed. So, we'll do it with
              // the parent's urlResolver Safari demonstrates similar behavior, but urlResolver.href has a relative URL value.
              var needUseParentResolver = url && (!href || href.charAt(0) === '/') &&
                  this._isNestedIframeWithoutSrc(doc.defaultView);
              if (needUseParentResolver)
                  return this.resolve(url, window.parent.document);
          }
          return ensureTrailingSlash(url, href);
      },
      updateBase: function (url, doc) {
          if (this.nativeAutomation)
              return;
          var resolverDocument = this._getResolver(doc);
          var baseElement = nativeMethods.elementGetElementsByTagName.call(resolverDocument.head, 'base')[0];
          url = url || get();
          /*eslint-disable no-restricted-properties*/
          var parsedUrl = parseUrl$1(url);
          var isRelativeUrl = parsedUrl.protocol !== 'file:' && parsedUrl.protocol !== 'about:' && !parsedUrl.host;
          var isProtocolRelativeUrl = /^\/\//.test(url) && !!parsedUrl.host;
          /*eslint-enable no-restricted-properties*/
          if (isRelativeUrl || isProtocolRelativeUrl) {
              var destinationLocation = get();
              this.updateBase(destinationLocation, doc);
              url = this.resolve(url, doc);
          }
          nativeMethods.setAttribute.call(baseElement, 'href', url);
      },
      getBaseUrl: function (doc) {
          var baseElement = nativeMethods.elementGetElementsByTagName.call(this._getResolver(doc).head, 'base')[0];
          return nativeMethods.getAttribute.call(baseElement, 'href');
      },
      changeUrlPart: function (url, nativePropSetter, value, doc) {
          var resolver = this.getResolverElement(doc);
          nativeMethods.anchorHrefSetter.call(resolver, url);
          nativePropSetter.call(resolver, value);
          return nativeMethods.anchorHrefGetter.call(resolver);
      },
      dispose: function (doc) {
          doc[DOCUMENT_URL_RESOLVER] = null;
      },
      get nativeAutomation() {
          return this._nativeAutomation;
      },
      set nativeAutomation(value) {
          this._nativeAutomation = value;
      },
  };

  var Settings = /** @class */ (function () {
      function Settings() {
          this._settings = {
              isFirstPageLoad: true,
              sessionId: '',
              forceProxySrcForImage: false,
              crossDomainProxyPort: '',
              referer: '',
              serviceMsgUrl: '',
              transportWorkerUrl: '',
              iframeTaskScriptTemplate: '',
              cookie: '',
              allowMultipleWindows: false,
              isRecordMode: false,
              windowId: '',
              nativeAutomation: false,
              disableCrossDomain: false,
          };
      }
      Settings.prototype.set = function (value) {
          this._settings = value;
      };
      Settings.prototype.get = function () {
          return this._settings;
      };
      Object.defineProperty(Settings.prototype, "nativeAutomation", {
          get: function () {
              return this._settings.nativeAutomation;
          },
          enumerable: false,
          configurable: true
      });
      return Settings;
  }());
  var settings = new Settings();

  var forcedLocation = null;
  // NOTE: exposed only for tests
  function getLocation() {
      // NOTE: Used for testing. Unfortunately, we cannot override the 'getLocation' method in a test.
      if (forcedLocation)
          return forcedLocation;
      var frameElement = getFrameElement(globalContextInfo.global);
      // NOTE: Fallback to the owner page's URL if we are in an iframe without src.
      if (frameElement && isIframeWithoutSrc(frameElement))
          return settings.get().referer;
      return globalContextInfo.global.location.toString();
  }
  // NOTE: We need to be able to force the page location. During the test, Hammerhead should think that it is on the
  // proxied page, not in the test environment. Unfortunately, we cannot do it in any other way.
  function forceLocation(url) {
      forcedLocation = url;
  }
  function sameOriginCheck(location, checkedUrl) {
      if (checkedUrl)
          checkedUrl = resolveUrl(checkedUrl);
      return settings.get().disableCrossDomain || sameOriginCheck$1(location, checkedUrl);
  }
  function resolveUrl(url, doc) {
      var preProcessedUrl = getURLString(url);
      if (preProcessedUrl && preProcessedUrl.indexOf('//') === 0) {
          // eslint-disable-next-line no-restricted-properties
          var pageProtocol = getParsed().protocol;
          preProcessedUrl = pageProtocol + correctMultipleSlashes(preProcessedUrl, pageProtocol);
      }
      else
          preProcessedUrl = correctMultipleSlashes(preProcessedUrl);
      if (globalContextInfo.isInWorker) {
          if (self.location.protocol !== 'blob:') // eslint-disable-line no-restricted-properties
              return new nativeMethods.URL(preProcessedUrl, get()).href; // eslint-disable-line no-restricted-properties
          return String(url);
      }
      return urlResolver.resolve(preProcessedUrl, doc || document);
  }
  var get = function () {
      var location = getLocation();
      var parsedProxyUrl = parseProxyUrl$1(location);
      return parsedProxyUrl ? parsedProxyUrl.destUrl : location;
  };
  function parseLocationThroughAnchor(url) {
      var resolver = urlResolver.getResolverElement(document);
      // eslint-disable-next-line no-restricted-properties
      var destPort = parseUrl$1(url).port;
      nativeMethods.anchorHrefSetter.call(resolver, get());
      var hostname = nativeMethods.anchorHostnameGetter.call(resolver);
      var pathname = nativeMethods.anchorPathnameGetter.call(resolver);
      // TODO: Describe default ports logic.
      return {
          protocol: nativeMethods.anchorProtocolGetter.call(resolver),
          // NOTE: Remove the default port.
          port: destPort ? nativeMethods.anchorPortGetter.call(resolver) : '',
          hostname: hostname,
          // NOTE: Remove the default port from the host.
          host: destPort ? nativeMethods.anchorHostGetter.call(resolver) : hostname,
          pathname: pathname,
          hash: resolver.hash,
          search: nativeMethods.anchorSearchGetter.call(resolver),
      };
  }
  function parseLocationThroughURL(url) {
      var parsedUrl = new nativeMethods.URL(url);
      /* eslint-disable no-restricted-properties */
      return {
          protocol: parsedUrl.protocol,
          port: parsedUrl.port,
          hostname: parsedUrl.hostname,
          host: parsedUrl.host,
          pathname: parsedUrl.pathname,
          hash: parsedUrl.hash,
          search: parsedUrl.search,
      };
      /* eslint-enable no-restricted-properties */
  }
  function getParsed() {
      var dest = get();
      return globalContextInfo.isInWorker ? parseLocationThroughURL(dest) : parseLocationThroughAnchor(dest);
  }
  function getOriginHeader() {
      return getDomain(getParsed());
  }

  var SUPPORTED_WEB_SOCKET_PROTOCOL_RE = /^wss?:/i;
  // NOTE: The window.location equals 'about:blank' in iframes without src
  // therefore we need to find a window with src to get the proxy settings
  var DEFAULT_PROXY_SETTINGS = (function () {
      /*eslint-disable no-restricted-properties*/
      var locationWindow = globalContextInfo.isInWorker ? { location: parseUrl(self.location.origin), parent: null } : window;
      var proxyLocation = locationWindow.location;
      while (!proxyLocation.hostname) {
          var isAboutBlankPageInNativeAutomation = !globalContextInfo.isInWorker && locationWindow === locationWindow.top;
          var isFileProtocolPageInNativeAutomation = proxyLocation.protocol === 'file:';
          if (isAboutBlankPageInNativeAutomation || isFileProtocolPageInNativeAutomation)
              break;
          locationWindow = locationWindow.parent;
          proxyLocation = locationWindow.location;
      }
      return {
          hostname: proxyLocation.hostname,
          port: proxyLocation.port?.toString() || (proxyLocation.protocol === "https:" ? 443 : 80),
          protocol: proxyLocation.protocol,
      };
      /*eslint-enable no-restricted-properties*/
  })();
  function getCharsetFromDocument(parsedResourceType) {
      if (!parsedResourceType.isScript && !parsedResourceType.isServiceWorker)
          return null;
      return self.document && document[INTERNAL_PROPS.documentCharset] || null;
  }
  var getProxyUrl = function (url, opts, nativeAutomation) {
      if (opts === void 0) { opts = {}; }
      if (nativeAutomation === void 0) { nativeAutomation = false; }
      if (opts.isUrlsSet) {
          opts.isUrlsSet = false;
          return handleUrlsSet(getProxyUrl, String(url), opts, nativeAutomation);
      }
      if (nativeAutomation)
          return String(url);
      url = getURLString(url);
      var resourceType = opts && opts.resourceType;
      var parsedResourceType = parseResourceType(resourceType);
      if (!parsedResourceType.isWebSocket && !isSupportedProtocol(url) && !isSpecialPage(url))
          return url;
      // NOTE: Resolves relative URLs.
      var resolvedUrl = resolveUrl(url, opts && opts.doc);
      if (parsedResourceType.isWebSocket && !isValidWebSocketUrl(resolvedUrl) || !isValidUrl(resolvedUrl))
          return url;
      /*eslint-disable no-restricted-properties*/
      var proxyHostname = opts && opts.proxyHostname || DEFAULT_PROXY_SETTINGS.hostname;
      var proxyPort = opts && opts.proxyPort || DEFAULT_PROXY_SETTINGS.port;
      var proxyServerProtocol = opts && opts.proxyProtocol || DEFAULT_PROXY_SETTINGS.protocol;
      /*eslint-enable no-restricted-properties*/
      var proxyProtocol = parsedResourceType.isWebSocket
          ? proxyServerProtocol.replace('http', 'ws')
          : proxyServerProtocol;
      var sessionId = opts && opts.sessionId || settings.get().sessionId;
      var windowId = opts && opts.windowId || settings.get().windowId;
      var credentials = opts && opts.credentials;
      var charset = opts && opts.charset;
      var reqOrigin = opts && opts.reqOrigin;
      var crossDomainPort = getCrossDomainProxyPort(proxyPort);
      // NOTE: If the relative URL contains no slash (e.g. 'img123'), the resolver will keep
      // the original proxy information, so that we can return such URL as is.
      // TODO: Implement the isProxyURL function.
      var parsedProxyUrl = parseProxyUrl$1(resolvedUrl);
      /*eslint-disable no-restricted-properties*/
      var isValidProxyUrl = !!parsedProxyUrl && parsedProxyUrl.proxy.hostname === proxyHostname &&
          (parsedProxyUrl.proxy.port === proxyPort || parsedProxyUrl.proxy.port === crossDomainPort);
      /*eslint-enable no-restricted-properties*/
      if (isValidProxyUrl) {
          if (resourceType && parsedProxyUrl.resourceType === resourceType)
              return resolvedUrl;
          // NOTE: Need to change the proxy URL resource type.
          var destUrl = formatUrl(parsedProxyUrl.destResourceInfo);
          return getProxyUrl(destUrl, {
              proxyProtocol: proxyProtocol,
              proxyHostname: proxyHostname,
              proxyPort: proxyPort,
              sessionId: sessionId,
              resourceType: resourceType,
              charset: charset,
              reqOrigin: reqOrigin,
              credentials: credentials,
          });
      }
      var parsedUrl = parseUrl$1(resolvedUrl);
      if (!parsedUrl.protocol) // eslint-disable-line no-restricted-properties
          return url;
      charset = charset || getCharsetFromDocument(parsedResourceType);
      // NOTE: It seems that the relative URL had the leading slash or dots, so that the proxy info path part was
      // removed by the resolver and we have an origin URL with the incorrect host and protocol.
      /*eslint-disable no-restricted-properties*/
      if (parsedUrl.protocol === proxyServerProtocol && parsedUrl.hostname === proxyHostname &&
          parsedUrl.port === proxyPort) {
          var parsedDestLocation = getParsed();
          parsedUrl.protocol = parsedDestLocation.protocol;
          parsedUrl.host = parsedDestLocation.host;
          parsedUrl.hostname = parsedDestLocation.hostname;
          parsedUrl.port = parsedDestLocation.port || '';
          resolvedUrl = formatUrl(parsedUrl);
      }
      /*eslint-enable no-restricted-properties*/
      if (parsedResourceType.isWebSocket) {
          // eslint-disable-next-line no-restricted-properties
          parsedUrl.protocol = parsedUrl.protocol.replace('ws', 'http');
          resolvedUrl = formatUrl(parsedUrl);
          reqOrigin = reqOrigin || getOriginHeader();
      }
      if (parsedResourceType.isIframe && proxyPort === settings.get().crossDomainProxyPort)
          reqOrigin = reqOrigin || getOriginHeader();
      return getProxyUrl$1(resolvedUrl, {
          proxyProtocol: proxyProtocol,
          proxyHostname: proxyHostname,
          proxyPort: proxyPort,
          sessionId: sessionId,
          resourceType: resourceType,
          charset: charset,
          reqOrigin: reqOrigin,
          windowId: windowId,
          credentials: credentials,
      });
  };
  function getCrossDomainProxyPort(proxyPort) {
      return settings.get().crossDomainProxyPort === proxyPort
          // eslint-disable-next-line no-restricted-properties
          ? location.port.toString()
          : settings.get().crossDomainProxyPort;
  }
  var resolveUrlAsDest = function (url, isUrlsSet) {
      if (isUrlsSet === void 0) { isUrlsSet = false; }
      return resolveUrlAsDest$1(url, getProxyUrl, isUrlsSet);
  };
  var parseProxyUrl = function (proxyUrl) {
      return parseProxyUrl$1(proxyUrl);
  };
  function parseUrl(url) {
      return parseUrl$1(url);
  }
  function isValidWebSocketUrl(url) {
      var resolvedUrl = resolveUrlAsDest(url);
      return SUPPORTED_WEB_SOCKET_PROTOCOL_RE.test(resolvedUrl);
  }
  function isSupportedProtocol(url) {
      return isSupportedProtocol$1(url);
  }
  function isSpecialPage(url) {
      return isSpecialPage$1(url);
  }
  function stringifyResourceType(resourceType) {
      return getResourceTypeString(resourceType);
  }
  function getDestinationUrl(proxyUrl) {
      var parsedProxyUrl = parseProxyUrl(proxyUrl);
      return parsedProxyUrl ? parsedProxyUrl.destUrl : proxyUrl;
  }
  function getAjaxProxyUrl(url, credentials, nativeAutomation) {
      if (nativeAutomation === void 0) { nativeAutomation = false; }
      if (nativeAutomation)
          return String(url);
      var isCrossDomain = !sameOriginCheck(getLocation(), url);
      var opts = { resourceType: stringifyResourceType({ isAjax: true }), credentials: credentials };
      if (isCrossDomain) {
          opts.proxyPort = settings.get().crossDomainProxyPort;
          opts.reqOrigin = getOriginHeader();
      }
      return getProxyUrl(url, opts);
  }

  var EventEmitter = /** @class */ (function () {
      function EventEmitter() {
          this.eventsListeners = nativeMethods.objectCreate(null);
      }
      EventEmitter.prototype.emit = function (evt) {
          var args = [];
          for (var _i = 1; _i < arguments.length; _i++) {
              args[_i - 1] = arguments[_i];
          }
          var listeners = this.eventsListeners[evt];
          if (!listeners)
              return;
          var index = 0;
          while (listeners[index])
              listeners[index++].apply(this, args);
      };
      EventEmitter.prototype.off = function (evt, listener) {
          var listeners = this.eventsListeners[evt];
          if (!listeners)
              return;
          this.eventsListeners[evt] = nativeMethods.arrayFilter.call(listeners, function (currentListener) { return currentListener !== listener; });
      };
      EventEmitter.prototype.on = function (evt, listener) {
          this.eventsListeners[evt] = this.eventsListeners[evt] || [];
          if (this.eventsListeners[evt].indexOf(listener) === -1)
              this.eventsListeners[evt].push(listener);
          return listener;
      };
      return EventEmitter;
  }());

  var SandboxBase = /** @class */ (function (_super) {
      __extends(SandboxBase, _super);
      function SandboxBase() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          _this.window = null;
          _this.nativeMethods = nativeMethods;
          _this.document = null;
          return _this;
      }
      // NOTE: The sandbox is deactivated when its window is removed from the DOM.
      SandboxBase.prototype.isDeactivated = function () {
          try {
              if (this.window[INTERNAL_PROPS.hammerhead]) {
                  var frameElement_1 = getFrameElement(this.window);
                  return !!frameElement_1 && !isElementInDocument(frameElement_1, findDocument(frameElement_1));
              }
          }
          catch (e) { // eslint-disable-line no-empty
          }
          return true;
      };
      SandboxBase.prototype.attach = function (window, document) {
          this.window = window;
          this.document = document || window.document;
      };
      return SandboxBase;
  }(EventEmitter));

  var SandboxBaseWithDelayedSettings = /** @class */ (function (_super) {
      __extends(SandboxBaseWithDelayedSettings, _super);
      function SandboxBaseWithDelayedSettings(_waitHammerheadSettings) {
          var _this = _super.call(this) || this;
          _this._waitHammerheadSettings = _waitHammerheadSettings;
          if (_waitHammerheadSettings) {
              _waitHammerheadSettings.then(function () {
                  _this._waitHammerheadSettings = null;
              });
          }
          return _this;
      }
      SandboxBaseWithDelayedSettings.prototype.gettingSettingInProgress = function () {
          return !!this._waitHammerheadSettings;
      };
      SandboxBaseWithDelayedSettings.prototype.delayUntilGetSettings = function (action) {
          return this._waitHammerheadSettings.then(action);
      };
      return SandboxBaseWithDelayedSettings;
  }(SandboxBase));

  // -------------------------------------------------------------
  // WARNING: this file is used by both the client and the server.
  // Do not use any browser or node-specific API!
  // -------------------------------------------------------------
  /* eslint hammerhead/proto-methods: 2 */
  var BUILTIN_HEADERS = {
      authorization: 'authorization',
      wwwAuthenticate: 'www-authenticate',
      proxyAuthorization: 'proxy-authorization',
      proxyAuthenticate: 'proxy-authenticate',
      host: 'host',
      referer: 'referer',
      origin: 'origin',
      contentLength: 'content-length',
      cookie: 'cookie',
      setCookie: 'set-cookie',
      ifModifiedSince: 'if-modified-since',
      ifNoneMatch: 'if-none-match',
      contentType: 'content-type',
      location: 'location',
      xFrameOptions: 'x-frame-options',
      sourceMap: 'sourcemap',
      referrerPolicy: 'referrer-policy',
      refresh: 'refresh',
      link: 'link',
      cacheControl: 'cache-control',
      pragma: 'pragma',
      eTag: 'etag',
      contentDisposition: 'content-disposition',
      accept: 'accept',
      contentEncoding: 'content-encoding',
      expires: 'expires',
      trailer: 'trailer',
      transferEncoding: 'transfer-encoding',
      serviceWorkerAllowed: 'service-worker-allowed',
      accessControlAllowOrigin: 'access-control-allow-origin',
      accessControlAllowCredentials: 'access-control-allow-credentials',
      accessControlAllowHeaders: 'access-control-allow-headers',
      contentSecurityPolicy: 'content-security-policy',
      contentSecurityPolicyReportOnly: 'content-security-policy-report-only',
      xContentSecurityPolicy: 'x-content-security-policy',
      xContentSecurityPolicyReportOnly: 'x-content-security-policy-report-only',
      xWebkitCsp: 'x-webkit-csp',
      isApiRequest: 'is-api-request',
      userAgent: 'user-agent',
  };

  // -------------------------------------------------------------
  var AUTHENTICATE_PREFIX = '~~~TestCafe added this prefix to hide the authentication dialog box~~~';
  var AUTHORIZATION_PREFIX = '~~~TestCafe added this prefix to control the authorization flow~~~';
  function hasAuthenticatePrefix(value) {
      return value.indexOf(AUTHENTICATE_PREFIX) > -1;
  }
  function removeAuthenticatePrefix(value) {
      return value.replace(AUTHENTICATE_PREFIX, '');
  }
  function isAuthenticateHeader(headerName) {
      var headerNameStr = String(headerName).toLowerCase();
      return headerNameStr === BUILTIN_HEADERS.wwwAuthenticate || headerNameStr === BUILTIN_HEADERS.proxyAuthenticate;
  }
  function addAuthorizationPrefix(value) {
      return AUTHORIZATION_PREFIX + value;
  }
  function hasAuthorizationPrefix(value) {
      return value.indexOf(AUTHORIZATION_PREFIX) > -1;
  }
  function removeAuthorizationPrefix(value) {
      return value.replace(AUTHORIZATION_PREFIX, '');
  }
  function isAuthorizationHeader(headerName) {
      var headerNameStr = String(headerName).toLowerCase();
      return headerNameStr === BUILTIN_HEADERS.authorization || headerNameStr === BUILTIN_HEADERS.proxyAuthorization;
  }

  var XHR_READY_STATES = ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'];
  var XhrSandbox = /** @class */ (function (_super) {
      __extends(XhrSandbox, _super);
      function XhrSandbox(_cookieSandbox, waitHammerheadSettings) {
          var _this = _super.call(this, waitHammerheadSettings) || this;
          _this._cookieSandbox = _cookieSandbox;
          _this.XHR_COMPLETED_EVENT = 'hammerhead|event|xhr-completed';
          _this.XHR_ERROR_EVENT = 'hammerhead|event|xhr-error';
          _this.BEFORE_XHR_SEND_EVENT = 'hammerhead|event|before-xhr-send';
          return _this;
      }
      XhrSandbox.setRequestOptions = function (req, withCredentials, args) {
          XhrSandbox.REQUESTS_OPTIONS.set(req, {
              withCredentials: withCredentials,
              openArgs: args,
              headers: [],
          });
      };
      XhrSandbox.createNativeXHR = function () {
          var xhr = new nativeMethods.XMLHttpRequest();
          xhr.open = nativeMethods.xhrOpen;
          xhr.abort = nativeMethods.xhrAbort;
          xhr.send = nativeMethods.xhrSend;
          xhr.addEventListener = nativeMethods.xhrAddEventListener || nativeMethods.addEventListener;
          xhr.removeEventListener = nativeMethods.xhrRemoveEventListener || nativeMethods.removeEventListener;
          xhr.setRequestHeader = nativeMethods.xhrSetRequestHeader;
          xhr.getResponseHeader = nativeMethods.xhrGetResponseHeader;
          xhr.getAllResponseHeaders = nativeMethods.xhrGetAllResponseHeaders;
          xhr.overrideMimeType = nativeMethods.xhrOverrideMimeType;
          xhr.dispatchEvent = nativeMethods.xhrDispatchEvent || nativeMethods.dispatchEvent;
          return xhr;
      };
      XhrSandbox.openNativeXhr = function (xhr, url, isAsync) {
          xhr.open('POST', url, isAsync);
          xhr.setRequestHeader(BUILTIN_HEADERS.cacheControl, 'no-cache, no-store, must-revalidate');
      };
      XhrSandbox.prototype.attach = function (window) {
          _super.prototype.attach.call(this, window);
          this.overrideXMLHttpRequest();
          this.overrideAbort();
          this.overrideOpen();
          this.overrideSend();
          this.overrideSetRequestHeader();
          if (settings.nativeAutomation)
              return;
          if (nativeMethods.xhrResponseURLGetter)
              this.overrideResponseURL();
          this.overrideGetResponseHeader();
          this.overrideGetAllResponseHeaders();
      };
      XhrSandbox.prototype.overrideXMLHttpRequest = function () {
          var emitXhrCompletedEvent = this.createEmitXhrCompletedEvent();
          var syncCookieWithClientIfNecessary = this.createSyncCookieWithClientIfNecessary();
          var xmlHttpRequestWrapper = function () {
              var nativeAddEventListener = nativeMethods.xhrAddEventListener || nativeMethods.addEventListener;
              var xhr = new nativeMethods.XMLHttpRequest();
              nativeAddEventListener.call(xhr, 'loadend', emitXhrCompletedEvent);
              nativeAddEventListener.call(xhr, 'readystatechange', syncCookieWithClientIfNecessary);
              return xhr;
          };
          for (var _i = 0, XHR_READY_STATES_1 = XHR_READY_STATES; _i < XHR_READY_STATES_1.length; _i++) {
              var readyState = XHR_READY_STATES_1[_i];
              nativeMethods.objectDefineProperty(xmlHttpRequestWrapper, readyState, nativeMethods.objectGetOwnPropertyDescriptor(nativeMethods.XMLHttpRequest, readyState));
          }
          // NOTE: We cannot just assign constructor property of the prototype of XMLHttpRequest starts from safari 9.0
          overrideConstructor(this.window, 'XMLHttpRequest', xmlHttpRequestWrapper);
          nativeMethods.objectDefineProperty(this.window.XMLHttpRequest.prototype, 'constructor', {
              value: xmlHttpRequestWrapper,
          });
      };
      XhrSandbox.prototype.overrideSend = function () {
          var xhrSandbox = this;
          var emitXhrCompletedEvent = this.createEmitXhrCompletedEvent();
          var syncCookieWithClientIfNecessary = this.createSyncCookieWithClientIfNecessary();
          overrideFunction(this.window.XMLHttpRequest.prototype, 'send', function () {
              var _this = this;
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              if (xhrSandbox.gettingSettingInProgress())
                  return void xhrSandbox.delayUntilGetSettings(function () { return _this.send.apply(_this, args); });
              var reqOpts = XhrSandbox.REQUESTS_OPTIONS.get(this);
              if (reqOpts && reqOpts.withCredentials !== this.withCredentials)
                  XhrSandbox.reopenXhr(this, reqOpts);
              xhrSandbox.emit(xhrSandbox.BEFORE_XHR_SEND_EVENT, { xhr: this });
              nativeMethods.xhrSend.apply(this, args);
              // NOTE: For xhr with the sync mode
              if (this.readyState === this.DONE)
                  emitXhrCompletedEvent.call(this);
              syncCookieWithClientIfNecessary.call(this);
          });
      };
      XhrSandbox.prototype.createEmitXhrCompletedEvent = function () {
          var xhrSandbox = this;
          var emitXhrCompletedEvent = function () {
              var nativeRemoveEventListener = nativeMethods.xhrRemoveEventListener || nativeMethods.removeEventListener;
              xhrSandbox.emit(xhrSandbox.XHR_COMPLETED_EVENT, { xhr: this });
              nativeRemoveEventListener.call(this, 'loadend', emitXhrCompletedEvent);
          };
          return emitXhrCompletedEvent;
      };
      XhrSandbox.prototype.createSyncCookieWithClientIfNecessary = function () {
          var xhrSandbox = this;
          var syncCookieWithClientIfNecessary = function () {
              if (this.readyState < this.HEADERS_RECEIVED)
                  return;
              var nativeRemoveEventListener = nativeMethods.xhrRemoveEventListener || nativeMethods.removeEventListener;
              xhrSandbox._cookieSandbox.syncCookie();
              nativeRemoveEventListener.call(this, 'readystatechange', syncCookieWithClientIfNecessary);
          };
          return syncCookieWithClientIfNecessary;
      };
      XhrSandbox.reopenXhr = function (xhr, reqOpts) {
          var url = reqOpts.openArgs[1];
          var withCredentials = xhr.withCredentials;
          reqOpts.withCredentials = withCredentials;
          reqOpts.openArgs[1] = getAjaxProxyUrl(url, withCredentials ? Credentials.include : Credentials.sameOrigin, settings.nativeAutomation);
          nativeMethods.xhrOpen.apply(xhr, reqOpts.openArgs);
          reqOpts.openArgs[1] = url;
          for (var _i = 0, _a = reqOpts.headers; _i < _a.length; _i++) {
              var header = _a[_i];
              nativeMethods.xhrSetRequestHeader.apply(xhr, header);
          }
      };
      XhrSandbox.prototype.overrideAbort = function () {
          var xhrSandbox = this;
          overrideFunction(this.window.XMLHttpRequest.prototype, 'abort', function () {
              var _this = this;
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              if (xhrSandbox.gettingSettingInProgress())
                  return void xhrSandbox.delayUntilGetSettings(function () { return _this.abort.apply(_this, args); });
              nativeMethods.xhrAbort.apply(this, args);
              xhrSandbox.emit(xhrSandbox.XHR_ERROR_EVENT, {
                  err: new Error('XHR aborted'),
                  xhr: this,
              });
          });
      };
      XhrSandbox.prototype.overrideOpen = function () {
          // NOTE: Redirect all requests to the Hammerhead proxy and ensure that requests don't
          // violate Same Origin Policy.
          var xhrSandbox = this;
          overrideFunction(this.window.XMLHttpRequest.prototype, 'open', function () {
              var _this = this;
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              var url = args[1];
              if (getProxyUrl(url, {}, settings.nativeAutomation) === url) {
                  XhrSandbox.setRequestOptions(this, this.withCredentials, args);
                  return void nativeMethods.xhrOpen.apply(this, args);
              }
              if (xhrSandbox.gettingSettingInProgress())
                  return void xhrSandbox.delayUntilGetSettings(function () { return _this.open.apply(_this, args); });
              url = typeof url === 'string' ? url : String(url);
              args[1] = getAjaxProxyUrl(url, this.withCredentials ? Credentials.include : Credentials.sameOrigin, settings.nativeAutomation);
              nativeMethods.xhrOpen.apply(this, args);
              args[1] = url;
              XhrSandbox.setRequestOptions(this, this.withCredentials, args);
          });
      };
      XhrSandbox.prototype.overrideSetRequestHeader = function () {
          overrideFunction(this.window.XMLHttpRequest.prototype, 'setRequestHeader', function () {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              if (!settings.nativeAutomation && isAuthorizationHeader(args[0]))
                  args[1] = addAuthorizationPrefix(args[1]);
              nativeMethods.xhrSetRequestHeader.apply(this, args);
              var reqOpts = XhrSandbox.REQUESTS_OPTIONS.get(this);
              if (reqOpts)
                  reqOpts.headers.push([String(args[0]), String(args[1])]);
          });
      };
      XhrSandbox.prototype.overrideResponseURL = function () {
          overrideDescriptor(this.window.XMLHttpRequest.prototype, 'responseURL', {
              getter: function () {
                  var nativeResponseURL = nativeMethods.xhrResponseURLGetter.call(this);
                  return getDestinationUrl(nativeResponseURL);
              },
          });
      };
      XhrSandbox.prototype.overrideGetResponseHeader = function () {
          overrideFunction(this.window.XMLHttpRequest.prototype, 'getResponseHeader', function () {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              var value = nativeMethods.xhrGetResponseHeader.apply(this, args);
              if (value && isAuthenticateHeader(args[0]))
                  value = removeAuthenticatePrefix(value);
              return value;
          });
      };
      XhrSandbox.prototype.overrideGetAllResponseHeaders = function () {
          overrideFunction(this.window.XMLHttpRequest.prototype, 'getAllResponseHeaders', function () {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              var allHeaders = nativeMethods.xhrGetAllResponseHeaders.apply(this, args);
              while (hasAuthenticatePrefix(allHeaders))
                  allHeaders = removeAuthenticatePrefix(allHeaders);
              return allHeaders;
          });
      };
      XhrSandbox.REQUESTS_OPTIONS = new WeakMap();
      return XhrSandbox;
  }(SandboxBaseWithDelayedSettings));

  function getCredentialsMode(credentialsOpt) {
      credentialsOpt = String(credentialsOpt).toLowerCase();
      switch (credentialsOpt) {
          case 'omit': return Credentials.omit;
          case 'same-origin': return Credentials.sameOrigin;
          case 'include': return Credentials.include;
          default: return Credentials.unknown;
      }
  }
  var DEFAULT_REQUEST_CREDENTIALS = getCredentialsMode(nativeMethods.Request && new nativeMethods.Request(location.toString()).credentials);
  var FetchSandbox = /** @class */ (function (_super) {
      __extends(FetchSandbox, _super);
      function FetchSandbox(cookieSandbox, waitHammerheadSettings) {
          var _this = _super.call(this, waitHammerheadSettings) || this;
          _this.cookieSandbox = cookieSandbox;
          _this.FETCH_REQUEST_SENT_EVENT = 'hammerhead|event|fetch-request-sent-event';
          return _this;
      }
      FetchSandbox.removeAuthHeadersPrefix = function (name, value) {
          if (isAuthorizationHeader(name))
              return removeAuthorizationPrefix(value);
          else if (isAuthenticateHeader(name))
              return removeAuthenticatePrefix(value);
          return value;
      };
      FetchSandbox.processInit = function (init) {
          var headers = init.headers;
          if (!headers)
              return init;
          if (!isFetchHeaders(headers)) {
              headers = headers ? new nativeMethods.Headers(headers) : new nativeMethods.Headers();
              init.headers = headers;
          }
          var authorizationValue = nativeMethods.headersGet.call(headers, BUILTIN_HEADERS.authorization);
          var proxyAuthorizationValue = nativeMethods.headersGet.call(headers, BUILTIN_HEADERS.proxyAuthorization);
          if (authorizationValue !== null && !hasAuthorizationPrefix(authorizationValue))
              nativeMethods.headersSet.call(headers, BUILTIN_HEADERS.authorization, addAuthorizationPrefix(authorizationValue));
          if (proxyAuthorizationValue !== null && !hasAuthorizationPrefix(proxyAuthorizationValue))
              nativeMethods.headersSet.call(headers, BUILTIN_HEADERS.proxyAuthorization, addAuthorizationPrefix(proxyAuthorizationValue));
          return init;
      };
      FetchSandbox.processArguments = function (args) {
          var input = args[0], init = args[1];
          var inputIsString = typeof input === 'string';
          var optsCredentials = getCredentialsMode(init && init.credentials);
          if (!isFetchRequest(input)) {
              var url = inputIsString ? input : String(input);
              var credentials = optsCredentials === Credentials.unknown ? DEFAULT_REQUEST_CREDENTIALS : optsCredentials;
              args[0] = getAjaxProxyUrl(url, credentials, settings.nativeAutomation);
              args[1] = FetchSandbox.processInit(init || {});
          }
          else {
              if (optsCredentials !== Credentials.unknown)
                  args[0] = getAjaxProxyUrl(input.url, optsCredentials);
              if (init && init.headers && input.destination !== 'worker')
                  args[1] = FetchSandbox.processInit(init);
          }
      };
      FetchSandbox.processHeaderEntry = function (entry, isOnlyValue) {
          if (isOnlyValue === void 0) { isOnlyValue = false; }
          if (entry.done)
              return entry;
          /* eslint-disable no-restricted-properties */
          var processedValue = FetchSandbox.removeAuthHeadersPrefix(entry.value[0], entry.value[1]);
          if (isOnlyValue)
              entry.value = processedValue;
          else
              entry.value[1] = processedValue;
          /* eslint-enable no-restricted-properties */
          return entry;
      };
      FetchSandbox.entriesWrapper = function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          var iterator = nativeMethods.headersEntries.apply(this, args);
          var nativeNext = iterator.next;
          iterator.next = function () { return FetchSandbox.processHeaderEntry(nativeNext.call(iterator)); };
          return iterator;
      };
      FetchSandbox.valuesWrapper = function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          var iterator = nativeMethods.headersEntries.apply(this, args);
          var nativeNext = iterator.next;
          iterator.next = function () { return FetchSandbox.processHeaderEntry(nativeNext.call(iterator), true); };
          return iterator;
      };
      FetchSandbox.prototype.attach = function (window) {
          _super.prototype.attach.call(this, window, window.document);
          if (!nativeMethods.fetch)
              return;
          if (!settings.nativeAutomation) {
              this.overrideRequestInWindow();
              this.overrideUrlInRequest();
              this.overrideReferrerInRequest();
              this.overrideUrlInResponse();
              this.overrideEntriesInHeaders();
              this.overrideSymbolIteratorInHeaders();
              this.overrideValuesInHeaders();
              this.overrideForEachInHeaders();
              this.overrideGetInHeaders();
              this.overrideSetInHeaders();
          }
          this.overrideFetchInWindow();
      };
      FetchSandbox.prototype.overrideRequestInWindow = function () {
          var window = this.window;
          overrideConstructor(window, 'Request', function () {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              FetchSandbox.processArguments(args);
              window.Headers.prototype.entries = window.Headers.prototype[Symbol.iterator] = nativeMethods.headersEntries;
              var request = args.length === 1
                  ? new nativeMethods.Request(args[0])
                  : new nativeMethods.Request(args[0], args[1]);
              window.Headers.prototype.entries = window.Headers.prototype[Symbol.iterator] = FetchSandbox.entriesWrapper;
              return request;
          });
      };
      FetchSandbox.prototype.overrideUrlInRequest = function () {
          overrideDescriptor(this.window.Request.prototype, 'url', {
              getter: function () {
                  var nativeRequestUrl = nativeMethods.requestUrlGetter.call(this);
                  return getDestinationUrl(nativeRequestUrl);
              },
          });
      };
      FetchSandbox.prototype.overrideReferrerInRequest = function () {
          overrideDescriptor(this.window.Request.prototype, 'referrer', {
              getter: function () {
                  var nativeReferrer = nativeMethods.requestReferrerGetter.call(this);
                  return getDestinationUrl(nativeReferrer);
              },
          });
      };
      FetchSandbox.prototype.overrideUrlInResponse = function () {
          overrideDescriptor(this.window.Response.prototype, 'url', {
              getter: function () {
                  var nativeResponseUrl = nativeMethods.responseUrlGetter.call(this);
                  return getDestinationUrl(nativeResponseUrl);
              },
          });
      };
      FetchSandbox.prototype.overrideEntriesInHeaders = function () {
          overrideFunction(this.window.Headers.prototype, 'entries', FetchSandbox.entriesWrapper);
      };
      FetchSandbox.prototype.overrideSymbolIteratorInHeaders = function () {
          overrideFunction(this.window.Headers.prototype, Symbol.iterator, FetchSandbox.entriesWrapper);
      };
      FetchSandbox.prototype.overrideValuesInHeaders = function () {
          overrideFunction(this.window.Headers.prototype, 'values', FetchSandbox.valuesWrapper);
      };
      FetchSandbox.prototype.overrideForEachInHeaders = function () {
          overrideFunction(this.window.Headers.prototype, 'forEach', function () {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              var callback = args[0];
              if (isFunction(callback)) {
                  args[0] = function (value, name, headers) {
                      value = FetchSandbox.removeAuthHeadersPrefix(name, value);
                      callback.call(this, value, name, headers);
                  };
              }
              return nativeMethods.headersForEach.apply(this, args);
          });
      };
      FetchSandbox.prototype.overrideGetInHeaders = function () {
          overrideFunction(this.window.Headers.prototype, 'get', function () {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              var value = nativeMethods.headersGet.apply(this, args);
              return value && FetchSandbox.removeAuthHeadersPrefix(args[0], value);
          });
      };
      FetchSandbox.prototype.overrideSetInHeaders = function () {
          overrideFunction(this.window.Headers.prototype, 'set', function () {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              if (isAuthorizationHeader(args[0]))
                  args[1] = addAuthorizationPrefix(args[1]);
              return nativeMethods.headersSet.apply(this, args);
          });
      };
      FetchSandbox.prototype.overrideFetchInWindow = function () {
          var sandbox = this;
          overrideFunction(this.window, 'fetch', function () {
              var _this = this;
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              if (!settings.nativeAutomation && sandbox.gettingSettingInProgress())
                  return sandbox.delayUntilGetSettings(function () { return _this.fetch.apply(_this, args); });
              // NOTE: Safari processed the empty `fetch()` request without `Promise` rejection (GH-1613)
              if (!args.length && !isSafari)
                  return nativeMethods.fetch.apply(this, args);
              if (settings.nativeAutomation) {
                  var fetchPromise_1 = nativeMethods.fetch.apply(this, args);
                  sandbox.emit(sandbox.FETCH_REQUEST_SENT_EVENT, fetchPromise_1);
                  return fetchPromise_1;
              }
              try {
                  FetchSandbox.processArguments(args);
              }
              catch (e) {
                  return nativeMethods.promiseReject.call(sandbox.window.Promise, e);
              }
              sandbox.window.Headers.prototype.entries = sandbox.window.Headers.prototype[Symbol.iterator] = nativeMethods.headersEntries;
              var fetchPromise = nativeMethods.fetch.apply(this, args);
              sandbox.window.Headers.prototype.entries = sandbox.window.Headers.prototype[Symbol.iterator] = FetchSandbox.entriesWrapper;
              sandbox.emit(sandbox.FETCH_REQUEST_SENT_EVENT, fetchPromise);
              return nativeMethods.promiseThen.call(fetchPromise, function (response) {
                  sandbox.cookieSandbox.syncCookie();
                  return response;
              });
          });
      };
      return FetchSandbox;
  }(SandboxBaseWithDelayedSettings));

  function stopPropagation(ev) {
      if (ev.stopImmediatePropagation)
          ev.stopImmediatePropagation();
      else if (ev.stopPropagation)
          ev.stopPropagation();
      ev.cancelBubble = true;
  }
  !!(nativeMethods.WindowPointerEvent || nativeMethods.WindowMSPointerEvent);

  var SET_SERVICE_WORKER_SETTINGS = 'hammerhead|set-service-worker-settings';

  // -------------------------------------------------------------
  // WARNING: this file is used by both the client and the server.
  // Do not use any browser or node-specific API!
  // -------------------------------------------------------------
  var INSTRUCTION = {
      getLocation: '__get$Loc',
      setLocation: '__set$Loc',
      getProperty: '__get$',
      setProperty: '__set$',
      callMethod: '__call$',
      processScript: '__proc$Script',
      processHtml: '__proc$Html',
      getEval: '__get$Eval',
      getPostMessage: '__get$PostMessage',
      getProxyUrl: '__get$ProxyUrl',
      restArray: '__rest$Array',
      arrayFrom: '__arrayFrom$',
      restObject: '__rest$Object',
      swScopeHeaderValue: '__swScopeHeaderValue',
      getWorkerSettings: '__getWorkerSettings$',
  };

  /*eslint-disable*/
  var swFetchCheckSettings = {
      protocol: '',
      host: '',
      scope: ''
  };
  function isCorrectScope(parsedUrl) {
      return parsedUrl.protocol === swFetchCheckSettings.protocol &&
          parsedUrl.host === swFetchCheckSettings.host &&
          parsedUrl.partAfterHost.startsWith(swFetchCheckSettings.scope);
  }
  function overrideFetchEvent() {
      var waitSettingsPromise = new Promise(function (resolve, reject) {
          nativeMethods.windowAddEventListener.call(self, 'message', function onMessage(e /*ExtendableMessageEvent*/) {
              var data = e.data;
              if (data.cmd !== SET_SERVICE_WORKER_SETTINGS)
                  return;
              var swScopeHeaderExists = self[INSTRUCTION.swScopeHeaderValue] !== void 0;
              var currentScope = swScopeHeaderExists ? self[INSTRUCTION.swScopeHeaderValue] : data.currentScope;
              var scope = data.optsScope;
              if (!scope)
                  scope = currentScope;
              else if (!scope.startsWith(currentScope)) {
                  // @ts-ignore
                  self.registration.unregister();
                  var errorMessage = "The path of the provided scope ('".concat(data.optsScope, "') is not under the max ") +
                      "scope allowed (".concat(swScopeHeaderExists ? 'set by Service-Worker-Allowed: ' : '', "'") +
                      "".concat(currentScope, "'). Adjust the scope, move the Service Worker script, ") +
                      'or use the Service-Worker-Allowed HTTP header to allow the scope.';
                  e.ports[0].postMessage({ error: errorMessage });
                  reject(new Error(errorMessage));
                  return;
              }
              e.ports[0].postMessage({});
              swFetchCheckSettings.protocol = data.protocol;
              swFetchCheckSettings.host = data.host;
              swFetchCheckSettings.scope = scope;
              nativeMethods.windowRemoveEventListener.call(self, 'message', onMessage);
              stopPropagation(e);
              waitSettingsPromise = null;
              resolve();
          });
      });
      self.addEventListener('install', function (e /*InstallEvent*/) { return e.waitUntil(waitSettingsPromise); });
      nativeMethods.windowAddEventListener.call(self, 'fetch', function (e /*FetchEvent*/) {
          var request = e.request;
          var proxyUrl = nativeMethods.requestUrlGetter.call(request);
          var parsedProxyUrl = parseProxyUrl(proxyUrl);
          var isInternalRequest = !parsedProxyUrl;
          if (!isInternalRequest) {
              // @ts-ignore Chrome has a non-standard the "iframe" destination
              var isPage = request.destination === 'document' || request.destination === 'iframe';
              if (isPage) {
                  if (isCorrectScope(parsedProxyUrl.destResourceInfo))
                      return;
              }
              else {
                  var proxyReferrer = nativeMethods.requestReferrerGetter.call(request);
                  var parsedProxyReferrer = parseProxyUrl(proxyReferrer);
                  if (parsedProxyReferrer && isCorrectScope(parsedProxyReferrer.destResourceInfo))
                      return;
              }
          }
          // NOTE: This request should not have gotten into this service worker
          e.respondWith(nativeMethods.fetch.call(self, request));
          stopPropagation(e);
      });
  }

  function noop () {
      // NOTE: empty function
  }

  var WorkerHammerhead = /** @class */ (function () {
      function WorkerHammerhead() {
          var parsedLocation = parseProxyUrl$1(location.toString());
          var cookieSandboxMock = { syncCookie: noop };
          // NOTE: the blob location case
          if (!parsedLocation)
              this._getBlobSettings();
          else
              WorkerHammerhead._setProxySettings(parsedLocation.sessionId, parsedLocation.windowId);
          this.fetch = new FetchSandbox(cookieSandboxMock);
          this.fetch.attach(self);
          WorkerHammerhead._overrideImportScripts();
          if (!globalContextInfo.isServiceWorker) {
              this.xhr = new XhrSandbox(cookieSandboxMock);
              this.xhr.attach(self);
          }
          else
              overrideFetchEvent();
      }
      WorkerHammerhead._setProxySettings = function (sessionId, windowId) {
          var currentSettings = settings.get();
          currentSettings.sessionId = sessionId;
          currentSettings.windowId = windowId;
          settings.set(currentSettings);
      };
      WorkerHammerhead._overrideImportScripts = function () {
          // @ts-ignore
          overrideFunction(self, 'importScripts', function () {
              var urls = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  urls[_i] = arguments[_i];
              }
              for (var i = 0; i < urls.length; i++)
                  urls[i] = getProxyUrl(urls[i], { resourceType: stringifyResourceType({ isScript: true }) });
              return nativeMethods.importScripts.apply(self, urls);
          });
      };
      WorkerHammerhead.prototype._getBlobSettings = function () {
          var data = self[INSTRUCTION.getWorkerSettings]();
          WorkerHammerhead._setProxySettings(data.sessionId, data.windowId);
          forceLocation(data.origin); // eslint-disable-line no-restricted-properties
      };
      return WorkerHammerhead;
  }());
  var index = new WorkerHammerhead();

  return index;

})();