/**
 * @license
 * Copyright 2024 Google LLC
 * Copyright 2025 Martin Hawksey
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Class for managing GoogleAI content caches.
 * @public
 */

class CachedContentUrl extends ServerRequestUrl {
    constructor(task, auth, requestOptions) {
      super(task, auth, requestOptions); // Pass auth to super
      this.task = task;
      this._auth = auth;
      this.requestOptions = requestOptions;
  
      let baseUrl;
      let apiVersion;
  
      if (this._auth.region && this._auth.project_id) { // Vertex AI endpoint
        apiVersion = this.requestOptions?.apiVersion || DEFAULT_API_VERSION_VERTEX;
        baseUrl = `https://${this._auth.region}-aiplatform.googleapis.com/${apiVersion}/projects/${this._auth.project_id}/locations/${this._auth.region}/cachedContents`;
      } else { // Standard endpoint
        apiVersion = this.requestOptions?.apiVersion || DEFAULT_API_VERSION_STUDIO;
        baseUrl = (this.requestOptions?.baseUrl) || `https://generativelanguage.googleapis.com/${apiVersion}/cachedContents`;
      }
  
      this._url = baseUrl;
    }
  }
  
  /**
   * Class for managing GoogleAI content caches.
   */
  class GoogleAICacheManager {
    constructor(options) {
      this._auth = {};
      if (typeof options === 'string') {
        this._auth.apiKey = options;
      } else {
        if (options.region && options.project_id) {
          this._auth.region = options.region;
          this._auth.project_id = options.project_id;
        }
        if (options.type && options.type === "service_account") {
          this._auth.type = options.type;
          this._auth.private_key = options.private_key;
          this._auth.client_email = options.client_email;
        }
      }
      this.requestOptions = options.requestOptions || {};
    }
  
    _getHeaders(auth) {
      const headers = {
        'Accept': 'application/json' // Always include Accept header
      };
      if (auth.apiKey) {
        headers['X-Goog-Api-Key'] = auth.apiKey;
      } else if (auth?.type === 'service_account') {
        const credentials = this._credentialsForVertexAI();
        headers['Authorization'] = `Bearer ${credentials.accessToken}`;
      } else {
        headers['Authorization'] = `Bearer ${ScriptApp.getOAuthToken()}`;
      }
      return headers;
    }
  
    _credentialsForVertexAI() {
      try {
        const service = OAuth2.createService("Vertex")
          .setTokenUrl('https://oauth2.googleapis.com/token')
          .setPrivateKey(this._auth.private_key)
          .setIssuer(this._auth.client_email)
          .setPropertyStore(PropertiesService.getScriptProperties())
          .setCache(CacheService.getScriptCache())
          .setScope("https://www.googleapis.com/auth/cloud-platform");
        return { accessToken: service.getAccessToken() };
      } catch (e) {
        console.error(e);
        throw e;
      }
    }
  
    _makeServerRequest(url, headers, body, fetchFn = UrlFetchApp.fetch) {
      const requestInit = {
        method: taskToMethod[url.task],
        contentType: 'application/json',
        headers
      }
      if (body) {
        requestInit.payload = body
      }
      return makeRequest_(url.toString(), requestInit, fetchFn)
    }
  
  
    /**
    * Upload a new content cache
    */
    create(createOptions) {
      const newCachedContent = { ...createOptions }
      if (createOptions.ttlSeconds) {
        if (createOptions.expireTime) {
          throw new GoogleGenerativeAIRequestInputError(
            "You cannot specify both `ttlSeconds` and `expireTime` when creating" +
            " a content cache. You must choose one."
          )
        }
        if (createOptions.systemInstruction) {
          newCachedContent.systemInstruction = formatSystemInstruction(
            createOptions.systemInstruction
          )
        }
        newCachedContent.ttl = createOptions.ttlSeconds.toString() + "s"
        delete newCachedContent.ttlSeconds
      }
      if (!newCachedContent.model) {
        throw new GoogleGenerativeAIRequestInputError(
          "Cached content must contain a `model` field."
        )
      }
      if (!newCachedContent.model.includes("/")) {
        // If path is not included, assume it's a non-tuned model.
        newCachedContent.model = `models/${newCachedContent.model}`
      }
      const url = new CachedContentUrl(
        RpcTask.CREATE,
        this._auth,
        this._requestOptions
      )
  
      const headers = this._getHeaders(this._auth)
  
      const response = this._makeServerRequest(
        url,
        headers,
        JSON.stringify(newCachedContent)
      )
      return response
    }
  
    /**
     * List all uploaded content caches
     */
    list(listParams) {
      const url = new CachedContentUrl(
        RpcTask.LIST,
        this._auth,
        this._requestOptions
      )
      if (listParams?.pageSize) {
        url.appendParam("pageSize", listParams.pageSize.toString())
      }
      if (listParams?.pageToken) {
        url.appendParam("pageToken", listParams.pageToken)
      }
      const headers = this._getHeaders(this._auth)
      const response = this._makeServerRequest(url, headers)
      return response
    }
  
    /**
     * Get a content cache
     */
    get(name) {
      const url = new CachedContentUrl(
        RpcTask.GET,
        this._auth,
        this._requestOptions
      )
      url.appendPath(this._parseCacheName(name))
      const headers = this._getHeaders(this._auth)
      const response = this._makeServerRequest(url, headers)
      return response
    }
  
    /**
     * Update an existing content cache
     */
    update(name, updateParams) {
      const url = new CachedContentUrl(
        RpcTask.UPDATE,
        this._auth,
        this._requestOptions
      )
      url.appendPath(this._parseCacheName(name))
      const headers = this._getHeaders(this._auth)
      const formattedCachedContent = {
        ...updateParams.cachedContent
      }
      if (updateParams.cachedContent.ttlSeconds) {
        formattedCachedContent.ttl =
          updateParams.cachedContent.ttlSeconds.toString() + "s"
        delete formattedCachedContent.ttlSeconds
      }
      if (updateParams.updateMask) {
        url.appendParam(
          "update_mask",
          updateParams.updateMask.map(prop => this._camelToSnake(prop)).join(",")
        )
      }
      const response = this._makeServerRequest(
        url,
        headers,
        JSON.stringify(formattedCachedContent)
      )
      return response
    }
  
    /**
     * Delete content cache with given name
     */
    delete(name) {
      const url = new CachedContentUrl(
        RpcTask.DELETE,
        this._auth,
        this._requestOptions
      )
      url.appendPath(this._parseCacheName(name))
      const headers = this._getHeaders(this._auth)
      this._makeServerRequest(url, headers)
    }
  
    /**
    * If cache name is prepended with "cachedContents/", remove prefix
    */
    _parseCacheName(name) {
      if (name.startsWith("cachedContents/")) {
        return name.split("cachedContents/")[1]
      }
      if (!name) {
        throw new GoogleGenerativeAIError(
          `Invalid name ${name}. ` +
          `Must be in the format "cachedContents/name" or "name"`
        )
      }
      return name
    }
  
    _camelToSnake(str) {
      return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    }
  
  }