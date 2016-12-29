# Constants
## ShapeType
Name | Value
-----|------
RICH_TEXT|0
RECTANGLE|1
IMAGE|2
VIDEO|3
HTML|4


# Data Types
## Vector2
Name | Type | Description
-----|------|------------
  x  | float|     x
  y  | float|     y

## Vector3
Name | Type | Description
-----|------|------------
  x | float | x
  y | float | y
  z | float | z

## Document
Name | Type | Description
-----|------|------------
id | string | Id of document
owner | string | User Id of owner
name | string | Name of document
slides | Slide[] | Key of the array is page
invitation | string[] | Invited user id
lastSave | int | Last saved

### Slide
Name | Type | Description
-----|------|------------
id | int | Id of slide
pos | Vector3 | Position of slide
rot | Vector3 | Rotation of slide
size | Vector2 | Size of slide

#### Shape
Name | Type | Description
-----|------|------------
id | int | Id of shape
pos | Vector2 | Position of shape
rot | Vector3 | Rotation of shape
size | Vector2 | Size of shape
type | int | Type of shape
meta | object | Other data needed to render shape

# UpdateSlidePacket
Name | Type | Description
-----|------|------------
slide| int | Id of slide
...args| mixed | Arguments

# UpdateShapePacket
Name | Type | Description
-----|------|------------
slide| int | Id of slide
shape| int | Id of shape
...args| mixed | Arguments


# Packets
## update slide
Name | Type | Description
-----|------|------------
document | int | Id of document
packets | UpdateSlidePacket[] | packets

## update shape
Name | Type | Description
-----|------|------------
document | int | Id of document
packets | UpdateShapePacket[] | packets

## create slide
Name | Type | Description
-----|------|------------
document | int | Id of document
slide (Optional)| int | Id of slide (If sent from server)

## Examples
```js
io.emit('update slide', [{
    slide: 0,
    posX: 2,
    sizeY: 500,
    rotationY: 30
}]);
```

```js
io.emit('update shape', [{
    slide: 0,
    shape: 1,
    posX: 2,
    meta: {
       html: '<span>blah blah</span>'
    }
}]);
```
