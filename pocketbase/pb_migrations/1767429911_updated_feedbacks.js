/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_440916241")

  // update collection data
  unmarshal({
    "listRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_440916241")

  // update collection data
  unmarshal({
    "listRule": "is_published=true && @request.headers.x_secret_key != \"\" && \n@collection.api_keys.secret ?= @request.headers.x_secret_key",
    "viewRule": "is_published=true && @request.headers.x_secret_key != \"\" && \n@collection.api_keys.secret ?= @request.headers.x_secret_key"
  }, collection)

  return app.save(collection)
})
