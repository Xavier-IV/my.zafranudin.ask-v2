/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // update collection data
  unmarshal({
    "createRule": "@request.headers.x_secret_key != \"\" && \n@collection.api_keys.secret ?= @request.headers.x_secret_key",
    "deleteRule": "@request.headers.x_secret_key != \"\" && \n@collection.api_keys.secret ?= @request.headers.x_secret_key",
    "listRule": "@request.headers.x_secret_key != \"\" && \n@collection.api_keys.secret ?= @request.headers.x_secret_key",
    "updateRule": "@request.headers.x_secret_key != \"\" && \n@collection.api_keys.secret ?= @request.headers.x_secret_key",
    "viewRule": "@request.headers.x_secret_key != \"\" && \n@collection.api_keys.secret ?= @request.headers.x_secret_key"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
