/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "json2525899086",
    "maxSize": 0,
    "name": "attachment_config",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // remove field
  collection.fields.removeById("json2525899086")

  return app.save(collection)
})
